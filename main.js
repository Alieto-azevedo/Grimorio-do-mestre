// Grimório do Mestre — processo principal (Electron)
// Responsável por: janela, arquivos das campanhas em disco, imagens, backups e importação do Notion.

const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { importarExportNotion } = require('./importador-notion');

protocol.registerSchemesAsPrivileged([
  { scheme: 'grimorio', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

const PASTA_DADOS = () => path.join(app.getPath('userData'), 'campanhas');
const pastaCampanha = (id) => {
  if (!/^[a-z0-9-]+$/i.test(String(id))) throw new Error('ID de campanha inválido');
  return path.join(PASTA_DADOS(), id);
};
const arquivoCampanha = (id) => path.join(pastaCampanha(id), 'campanha.json');
const pastaImagens = (id) => path.join(pastaCampanha(id), 'imagens');

function garantirPasta(p) { fs.mkdirSync(p, { recursive: true }); }
function novoId() { return crypto.randomBytes(6).toString('hex'); }

function escreverAtomico(arquivo, conteudo) {
  const tmp = arquivo + '.tmp';
  fs.writeFileSync(tmp, conteudo);
  fs.renameSync(tmp, arquivo);
}

// Guarda uma cópia por dia (mantém as 14 mais recentes)
function backupDiario(id) {
  const origem = arquivoCampanha(id);
  if (!fs.existsSync(origem)) return;
  const pasta = path.join(pastaCampanha(id), 'backups');
  garantirPasta(pasta);
  const hoje = new Date().toISOString().slice(0, 10);
  const destino = path.join(pasta, `campanha-${hoje}.json`);
  if (!fs.existsSync(destino)) fs.copyFileSync(origem, destino);
  const lista = fs.readdirSync(pasta).filter(f => f.endsWith('.json')).sort();
  while (lista.length > 14) fs.unlinkSync(path.join(pasta, lista.shift()));
}

function nomeImagemSeguro(nome) {
  const ext = (path.extname(nome || '') || '.png').toLowerCase().replace(/[^.a-z0-9]/g, '');
  const permitido = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.jfif', '.avif'];
  return novoId() + (permitido.includes(ext) ? ext : '.png');
}

// ---------- IPC ----------
function registrarIPC() {
  ipcMain.handle('camp:listar', () => {
    garantirPasta(PASTA_DADOS());
    return fs.readdirSync(PASTA_DADOS(), { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(PASTA_DADOS(), d.name, 'campanha.json')))
      .map(d => {
        try {
          const dados = JSON.parse(fs.readFileSync(path.join(PASTA_DADOS(), d.name, 'campanha.json'), 'utf8'));
          return { id: d.name, nome: dados.nome, editado: dados.editado || 0, total: Object.keys(dados.entidades || {}).length };
        } catch { return { id: d.name, nome: d.name + ' (arquivo danificado)', editado: 0, total: 0 }; }
      })
      .sort((a, b) => b.editado - a.editado);
  });

  ipcMain.handle('camp:carregar', (_e, id) => {
    const arq = arquivoCampanha(id);
    if (!fs.existsSync(arq)) return null;
    return JSON.parse(fs.readFileSync(arq, 'utf8'));
  });

  ipcMain.handle('camp:salvar', (_e, id, json) => {
    garantirPasta(pastaCampanha(id));
    backupDiario(id);
    escreverAtomico(arquivoCampanha(id), json);
    return true;
  });

  ipcMain.handle('camp:criar', (_e, dados) => {
    const id = novoId();
    garantirPasta(pastaImagens(id));
    dados.id = id;
    escreverAtomico(arquivoCampanha(id), JSON.stringify(dados));
    return id;
  });

  ipcMain.handle('camp:excluir', (_e, id) => {
    const lixeira = path.join(app.getPath('userData'), 'campanhas-excluidas');
    garantirPasta(lixeira);
    fs.renameSync(pastaCampanha(id), path.join(lixeira, id + '-' + Date.now()));
    return true;
  });

  ipcMain.handle('img:salvar', (_e, id, nomeOriginal, bytes) => {
    garantirPasta(pastaImagens(id));
    const nome = nomeImagemSeguro(nomeOriginal);
    fs.writeFileSync(path.join(pastaImagens(id), nome), Buffer.from(bytes));
    return nome;
  });

  ipcMain.handle('camp:exportar', async (e, id) => {
    const janela = BrowserWindow.fromWebContents(e.sender);
    const dados = JSON.parse(fs.readFileSync(arquivoCampanha(id), 'utf8'));
    const { canceled, filePath } = await dialog.showSaveDialog(janela, {
      title: 'Exportar campanha',
      defaultPath: (dados.nome || 'campanha').replace(/[\\/:*?"<>|]/g, '') + '.grimorio',
      filters: [{ name: 'Campanha do Grimório', extensions: ['grimorio'] }]
    });
    if (canceled || !filePath) return false;
    const imagens = {};
    if (fs.existsSync(pastaImagens(id))) {
      for (const f of fs.readdirSync(pastaImagens(id))) {
        imagens[f] = fs.readFileSync(path.join(pastaImagens(id), f)).toString('base64');
      }
    }
    fs.writeFileSync(filePath, JSON.stringify({ formato: 'grimorio-backup', versao: 1, campanha: dados, imagens }));
    return filePath;
  });

  ipcMain.handle('camp:importarBackup', async (e) => {
    const janela = BrowserWindow.fromWebContents(e.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
      title: 'Abrir campanha exportada',
      filters: [{ name: 'Campanha do Grimório', extensions: ['grimorio', 'json'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths[0]) return null;
    const pacote = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    if (pacote.formato !== 'grimorio-backup') throw new Error('Este arquivo não é uma campanha do Grimório.');
    const id = novoId();
    garantirPasta(pastaImagens(id));
    for (const [nome, b64] of Object.entries(pacote.imagens || {})) {
      fs.writeFileSync(path.join(pastaImagens(id), path.basename(nome)), Buffer.from(b64, 'base64'));
    }
    pacote.campanha.id = id;
    escreverAtomico(arquivoCampanha(id), JSON.stringify(pacote.campanha));
    return id;
  });

  ipcMain.handle('notion:importar', async (e, id) => {
    const janela = BrowserWindow.fromWebContents(e.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
      title: 'Selecione o arquivo .zip exportado do Notion',
      filters: [{ name: 'Exportação do Notion', extensions: ['zip'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths[0]) return null;
    garantirPasta(pastaImagens(id));
    return importarExportNotion(fs.readFileSync(filePaths[0]), (nomeOriginal, buffer) => {
      const nome = nomeImagemSeguro(nomeOriginal);
      fs.writeFileSync(path.join(pastaImagens(id), nome), buffer);
      return nome;
    });
  });

  ipcMain.handle('app:abrirPasta', (_e, id) => shell.openPath(id ? pastaCampanha(id) : PASTA_DADOS()));

  ipcMain.handle('app:abrirLink', (_e, url) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  ipcMain.handle('app:versao', () => app.getVersion());
}

// ---------- Janela ----------
function criarJanela() {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#17120e',
    title: 'Grimório do Mestre',
    icon: path.join(__dirname, 'app', 'icone.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });
  try { janela.webContents.session.setSpellCheckerLanguages(['pt-BR']); } catch { /* corretor nativo do sistema */ }
  janela.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Links externos abrem no navegador, nunca dentro do app
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  janela.webContents.on('will-navigate', (ev, url) => {
    if (!url.startsWith('file://')) {
      ev.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  protocol.handle('grimorio', (req) => {
    // grimorio://img/<campanha>/<arquivo>
    const u = new URL(req.url);
    const [campId, arquivo] = u.pathname.replace(/^\/+/, '').split('/').map(decodeURIComponent);
    if (u.host !== 'img' || !campId || !arquivo) return new Response('não encontrado', { status: 404 });
    const caminho = path.join(pastaImagens(campId), path.basename(arquivo));
    if (!fs.existsSync(caminho)) return new Response('não encontrado', { status: 404 });
    return net.fetch(pathToFileURL(caminho).toString());
  });
  registrarIPC();
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
