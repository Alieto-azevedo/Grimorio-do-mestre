// Importação (Notion .zip, Grimório antigo .grimorio, backup .json) e exportação de backup
(function () {
  const { h } = G;

  // ---------- Leitor de .zip no navegador ----------
  async function inflar(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(buf);
  }
  function lerZip(u8) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Arquivo .zip inválido.');
    let total = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
    if (p === 0xffffffff) { const loc = eocd - 20; const e64 = Number(dv.getBigUint64(loc + 8, true)); total = Number(dv.getBigUint64(e64 + 32, true)); p = Number(dv.getBigUint64(e64 + 48, true)); }
    const td = new TextDecoder('utf-8');
    const saida = [];
    for (let n = 0; n < total; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const metodo = dv.getUint16(p + 10, true);
      let comp = dv.getUint32(p + 20, true);
      const lNome = dv.getUint16(p + 28, true), lExtra = dv.getUint16(p + 30, true), lCom = dv.getUint16(p + 32, true);
      let off = dv.getUint32(p + 42, true);
      const nome = td.decode(u8.subarray(p + 46, p + 46 + lNome));
      let e = p + 46 + lNome; const fim = e + lExtra;
      while (e + 4 <= fim) {
        const id = dv.getUint16(e, true), tam = dv.getUint16(e + 2, true);
        if (id === 1) { let q = e + 4; if (dv.getUint32(p + 24, true) === 0xffffffff) q += 8; if (comp === 0xffffffff) { comp = Number(dv.getBigUint64(q, true)); q += 8; } if (off === 0xffffffff) off = Number(dv.getBigUint64(q, true)); }
        e += 4 + tam;
      }
      p = fim + lCom;
      if (nome.endsWith('/')) continue;
      const o = off;
      saida.push({
        nome, async ler() {
          const ini = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true);
          const dados = u8.subarray(ini, ini + comp);
          if (metodo === 0) return dados;
          if (metodo === 8) return inflar(dados);
          throw new Error('Compressão não suportada: ' + nome);
        }
      });
    }
    return saida;
  }
  async function coletar(u8, mapa = new Map()) {
    for (const ent of lerZip(u8)) {
      if (/\.zip$/i.test(ent.nome)) await coletar(await ent.ler(), mapa);
      else mapa.set(ent.nome, ent);
    }
    return mapa;
  }

  // ---------- Caminhos ----------
  const dirname = (p) => p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.';
  const basename = (p) => p.slice(p.lastIndexOf('/') + 1);
  function juntar(base, rel) {
    const partes = (base === '.' ? [] : base.split('/'));
    for (const s of rel.split('/')) { if (s === '..') partes.pop(); else if (s && s !== '.') partes.push(s); }
    return partes.join('/');
  }

  const RE_ID = /\s+([0-9a-f]{32})$/i;
  const EXT_IMG = /\.(png|jpe?g|gif|webp|bmp|jfif|avif)$/i;
  const semId = (s) => s.replace(RE_ID, '').trim();
  const TAGS_TIPO = { npc: 'npc', npcs: 'npc', 'vilão': 'npc', monstro: 'criatura', monstros: 'criatura', criatura: 'criatura', item: 'item', itens: 'item', mapas: 'local', mapa: 'local', local: 'local', cidade: 'local', personagens: null, deity: null };

  function lerCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    const linhas = []; let linha = [], campo = '', aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (aspas) { if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c; }
      else if (c === '"') aspas = true;
      else if (c === ',') { linha.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
      else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    const [cab, ...resto] = linhas.filter(l => l.some(x => x.trim()));
    return cab ? resto.map(l => Object.fromEntries(cab.map((k, i) => [k.trim(), (l[i] || '').trim()]))) : [];
  }
  function ndDoNotion(v) {
    if (!v) return '';
    const s = String(v).trim().replace(',', '.');
    if (/^\d+\/\d+$/.test(s)) return s;
    const n = parseFloat(s);
    if (isNaN(n)) return s;
    if (n >= 1) return String(Math.round(n));
    return n >= 0.45 ? '1/2' : n >= 0.3 ? '1/3' : n >= 0.2 ? '1/4' : n >= 0.15 ? '1/6' : '1/8';
  }
  function tipoPor(titulo, ancestrais, banco, tags) {
    if (banco && /personage|jogador|party|grupo/i.test(banco)) return 'jogador';
    for (const t of tags) { const k = t.toLowerCase().replace(/\.$/, ''); if (TAGS_TIPO[k]) return TAGS_TIPO[k]; }
    const c = [...ancestrais, banco || ''].join(' / ').toLowerCase();
    if (/sess[aã]o|di[aá]rio/i.test(titulo)) return 'sessao';
    if (/miss[aã]o|miss[oõ]es|quest/.test(c) || /^miss[aã]o/i.test(titulo)) return 'missao';
    if (/cidade|local|locais|regi[aã]o|reino|mapa/.test(c)) return 'local';
    if (/fac[cç]|guilda|organiza/.test(c)) return 'faccao';
    if (/npc/.test(c)) return 'npc';
    if (/\bite(m|ns)\b/.test(c)) return 'item';
    if (/monstr|besti|criatura/.test(c)) return 'criatura';
    return 'nota';
  }

  async function importarNotion(arquivo, progresso) {
    const arquivos = await coletar(new Uint8Array(await arquivo.arrayBuffer()));
    const mds = [...arquivos.keys()].filter(k => /\.md$/i.test(k));
    if (!mds.length) throw new Error('Nenhuma página encontrada. Exporte do Notion em "Markdown & CSV".');
    const td = new TextDecoder();
    const bancos = new Map();
    for (const c of [...arquivos.keys()].filter(k => /\.csv$/i.test(k) && !/_all\.csv$/i.test(k))) {
      const linhas = lerCSV(td.decode(await arquivos.get(c).ler()));
      const col = linhas[0] ? Object.keys(linhas[0])[0] : null;
      bancos.set(c.replace(/\.csv$/i, ''), { nome: semId(basename(c.replace(/\.csv$/i, ''))), porTitulo: new Map(linhas.map(l => [l[col], l])) });
    }
    const paginas = [];
    for (const cam of mds) {
      const texto = td.decode(await arquivos.get(cam).ler()).replace(/^﻿/, '').replace(/\r\n/g, '\n');
      const linhas = texto.split('\n');
      const nomeArq = basename(cam).replace(/\.md$/i, '');
      let titulo = semId(nomeArq), i = 0;
      while (i < linhas.length && !linhas[i].trim()) i++;
      if (/^#\s+/.test(linhas[i] || '')) { titulo = linhas[i].replace(/^#\s+/, '').trim(); i++; }
      const pasta = dirname(cam);
      const banco = bancos.get(pasta) || null;
      const props = {};
      let j = i;
      while (j < linhas.length && !linhas[j].trim()) j++;
      if (banco || /^(Tags|Tag|Status|Tipo)\s*:/i.test(linhas[j] || '')) {
        while (j < linhas.length && /^[^\s:#>\-*|!\[][^:]{0,40}:\s?/.test(linhas[j])) { const k = linhas[j].indexOf(':'); props[linhas[j].slice(0, k).trim()] = linhas[j].slice(k + 1).trim(); j++; }
        if (Object.keys(props).length) i = j;
      }
      if (banco && banco.porTitulo.has(titulo)) for (const [k, v] of Object.entries(banco.porTitulo.get(titulo))) if (!(k in props) && v) props[k] = v;
      paginas.push({ cam, pasta, titulo, props, banco, bruto: linhas.slice(i).join('\n').trim(), notionId: (nomeArq.match(RE_ID) || [])[1] || null, ancestrais: pasta === '.' ? [] : pasta.split('/').map(semId), temFilhos: mds.some(m => m.startsWith(cam.replace(/\.md$/i, '') + '/')), id: G.uid() });
    }
    const porCam = new Map(paginas.map(p => [p.cam, p]));
    const imgs = new Map();
    const avisos = [];
    let nImg = 0;

    async function converter(p) {
      let md = p.bruto.replace(/<aside>([\s\S]*?)<\/aside>/g, (_, d) => d.trim().split('\n').map(l => '> ' + l.replace(/<[^>]+>/g, '')).join('\n'));
      const trocas = [];
      md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (tudo, alt, alvo) => { trocas.push({ tudo, alt, alvo }); return tudo; });
      for (const t of trocas) {
        if (/^https?:/i.test(t.alvo)) continue;
        let real; try { real = juntar(p.pasta, decodeURIComponent(t.alvo)); } catch { real = juntar(p.pasta, t.alvo); }
        const ent = arquivos.get(real);
        if (!ent || !EXT_IMG.test(real)) { avisos.push(`Imagem não encontrada em "${p.titulo}"`); md = md.replace(t.tudo, ''); continue; }
        if (!imgs.has(real)) {
          progresso && progresso(`Enviando imagens… (${++nImg})`);
          try {
            const bytes = await ent.ler();
            const tipo = /\.png$/i.test(real) ? 'image/png' : /\.gif$/i.test(real) ? 'image/gif' : /\.webp$/i.test(real) ? 'image/webp' : 'image/jpeg';
            imgs.set(real, await G.loja.salvarImagem(new File([bytes], basename(real), { type: tipo })));
          } catch { avisos.push('Falha ao converter imagem ' + basename(real)); imgs.set(real, ''); }
        }
        const legenda = t.alt && !EXT_IMG.test(t.alt) && !/^image$/i.test(t.alt) ? t.alt : '';
        md = md.replace(t.tudo, imgs.get(real) ? `![${legenda}](${imgs.get(real)})` : '');
      }
      md = md.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, (tudo, texto, alvo) => {
        if (/^(https?:|mailto:)/i.test(alvo)) return tudo;
        let real; try { real = juntar(p.pasta, decodeURIComponent(alvo.split('#')[0])); } catch { return texto; }
        const d = porCam.get(real);
        if (d) return !texto || d.titulo === texto ? `[[${d.titulo}]]` : `[[${d.titulo}|${texto}]]`;
        return texto;
      });
      return md.replace(/<\/?(span|div|details|summary|br)[^>]*>/gi, '').replace(/\n{3,}/g, '\n\n').trim();
    }

    const ents = [];
    const faccoes = new Map();
    let ignoradas = 0;
    for (const p of paginas) {
      const tags0 = (p.props.Tags || p.props.Tag || '').split(',').map(t => t.trim()).filter(Boolean);
      const tipo = tipoPor(p.titulo, p.ancestrais, p.banco && p.banco.nome, tags0);
      let corpo = await converter(p);
      if (p.temFilhos && !p.banco && corpo.replace(/\[\[[^\]]+\]\]/g, '').replace(/[\s\-*#>]/g, '').length < 30) { ignoradas++; continue; }
      const campos = {}, tags = [];
      let faccao = null;
      for (const t of tags0) {
        const k = t.toLowerCase().replace(/\.$/, '');
        if (k in TAGS_TIPO) { if (TAGS_TIPO[k] === null) tags.push(t.replace(/\.$/, '')); continue; }
        const limpo = t.replace(/\.$/, '');
        if (tipo === 'npc' && !faccao) faccao = limpo;
        tags.push(limpo);
      }
      if (faccao) { if (!faccoes.has(faccao)) faccoes.set(faccao, G.uid()); campos.faccao = faccoes.get(faccao); }
      let ficha = null;
      const P = (k) => p.props[k] || '';
      if (tipo === 'jogador') {
        Object.assign(campos, { jogador: P('Player') || P('Jogador'), link: P('Link') });
        ficha = { ca: P('CA'), ini: P('Iniciativa'), percepcao: P('Percepção') };
      }
      if (tipo === 'criatura') {
        if (/\b(AC|CA)\s*\d+/.test(corpo) && /\b(hp|PV)\s*\d+/.test(corpo)) { ficha = G.statblock.ler(p.titulo + '\n' + corpo); delete ficha.nome; }
        const nd = ndDoNotion(P('Nível de desafio') || P('ND') || P('CR'));
        if (nd) { ficha = ficha || {}; ficha.nd = nd; ficha.xp = ficha.xp || String(G.XP_POR_ND[nd] || ''); }
      }
      const primeira = corpo.match(/!\[[^\]]*\]\((img:[^)]+)\)/);
      if (primeira && corpo.indexOf(primeira[0]) === 0) corpo = corpo.slice(primeira[0].length).trim();
      ents.push({ id: p.id, tipo, titulo: p.titulo, campos, tags, corpo, capa: primeira ? primeira[1] : '', ficha, notionId: p.notionId });
    }
    for (const [nome, id] of faccoes) {
      const ex = ents.find(e => e.tipo === 'faccao' && G.normalizar(e.titulo) === G.normalizar(nome));
      if (ex) { ents.forEach(e => { if (e.campos.faccao === id) e.campos.faccao = ex.id; }); continue; }
      ents.push({ id, tipo: 'faccao', titulo: nome, campos: {}, tags: [], corpo: 'Facção criada a partir da tag do Notion.', capa: '', ficha: null, notionId: null });
    }
    const raiz = paginas.find(p => !p.ancestrais.length);
    return { nome: raiz ? raiz.titulo : null, ents, imagens: nImg, ignoradas, avisos };
  }

  // ---------- Grimório antigo (desktop) ----------
  async function importarGrimorioAntigo(pacote, progresso) {
    const antigas = Object.values(pacote.campanha.entidades || {});
    const mapaImg = new Map();
    let n = 0;
    const subir = async (ref) => {
      if (!ref || !ref.startsWith('img:')) return ref;
      const nome = ref.slice(4);
      if (mapaImg.has(nome)) return mapaImg.get(nome);
      const b64 = (pacote.imagens || {})[nome];
      if (!b64) { mapaImg.set(nome, ''); return ''; }
      progresso && progresso(`Enviando imagens… (${++n})`);
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const r = await G.loja.salvarImagem(new File([bytes], nome, { type: /\.png$/i.test(nome) ? 'image/png' : 'image/jpeg' })).catch(() => '');
      mapaImg.set(nome, r);
      return r;
    };
    const ents = [];
    for (const a of antigas) {
      let corpo = a.corpo || '';
      for (const m of [...corpo.matchAll(/\]\((img:[^)]+)\)/g)]) corpo = corpo.replace(m[1], await subir(m[1]) || '');
      const c = a.campos || {};
      const campos = Object.assign({}, c);
      let ficha = null;
      if (a.tipo === 'criatura' || a.tipo === 'jogador') {
        ficha = { nd: c.nd || '', ca: c.ca || '', pv: c.pv || c.pvMax || '', ini: c.iniciativa ?? '', percepcao: c.percepcao ?? '' };
        if (a.tipo === 'criatura') {
          const lido = /\b(AC|CA)\s*\d+/.test(corpo) ? G.statblock.ler(corpo) : null;
          if (lido) { delete lido.nome; ficha = Object.assign({}, lido, Object.fromEntries(Object.entries(ficha).filter(([, v]) => v !== ''))); }
          if (ficha.nd && G.XP_POR_ND[ficha.nd]) ficha.xp = String(G.XP_POR_ND[ficha.nd]);
        }
        ['nd', 'ca', 'pv', 'pvMax', 'iniciativa', 'percepcao'].forEach(k => delete campos[k]);
      }
      ents.push({ id: a.id, tipo: G.TIPOS[a.tipo] ? a.tipo : 'nota', titulo: a.titulo, campos, tags: a.tags || [], corpo, capa: await subir(a.capa), ficha, notionId: a.notionId || null });
    }
    return { nome: pacote.campanha.nome, ents, imagens: n, ignoradas: 0, avisos: [] };
  }

  // ---------- Backup deste app ----------
  async function exportarBackup() {
    const ents = G.loja.lista();
    const imagens = {};
    const refs = new Set();
    ents.forEach(e => { if (e.capa) refs.add(e.capa); (e.corpo || '').replace(/\((img:[^)]+)\)/g, (_, r) => refs.add(r)); });
    for (const r of refs) { const u = await G.loja.urlImagem(r); if (u) imagens[r] = u; }
    const m = G.loja.meta;
    const blob = new Blob([JSON.stringify({ formato: 'grimorio-v2', versao: 1, meta: { nome: m.nome, sistema: m.sistema, config: m.config }, entidades: ents, imagens })], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${m.nome.replace(/[\\/:*?"<>|]/g, '')} ${new Date().toISOString().slice(0, 10)}.grimorio.json` });
    document.body.appendChild(a); a.click(); a.remove();
  }
  async function importarBackupV2(pacote, progresso) {
    const mapa = new Map();
    let n = 0;
    for (const [ref, url] of Object.entries(pacote.imagens || {})) { progresso && progresso(`Enviando imagens… (${++n})`); mapa.set(ref, await G.loja.salvarImagem(url)); }
    const troca = (s) => s ? s.replace(/img:[A-Za-z0-9]+/g, (r) => mapa.get(r) || r) : s;
    return { nome: pacote.meta && pacote.meta.nome, ents: pacote.entidades.map(e => Object.assign({}, e, { corpo: troca(e.corpo), capa: troca(e.capa) })), imagens: n, ignoradas: 0, avisos: [] };
  }

  // ---------- Janela ----------
  G.janelaImportar = function () {
    const status = h('p', { class: 'dica status-imp' });
    const escolher = async () => {
      const arq = await G.escolherArquivo('.zip,.grimorio,.json,application/zip,application/json');
      if (!arq) return;
      const prog = (t) => { status.textContent = t; };
      try {
        prog('Lendo arquivo…');
        let r;
        if (/\.zip$/i.test(arq.name)) r = await importarNotion(arq, prog);
        else {
          const pacote = JSON.parse(await arq.text());
          if (pacote.formato === 'grimorio-backup') r = await importarGrimorioAntigo(pacote, prog);
          else if (pacote.formato === 'grimorio-v2') r = await importarBackupV2(pacote, prog);
          else throw new Error('Formato de arquivo não reconhecido.');
        }
        prog('Salvando páginas…');
        const res = await G.loja.importar(r.ents);
        const m = G.loja.meta;
        if (r.nome && /^(Nova campanha|Minha campanha)$/.test(m.nome)) { m.nome = r.nome.trim(); G.loja.salvarMeta(); G.emitir('meta'); }
        const porTipo = {};
        r.ents.forEach(e => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });
        f.fechar();
        G.folha({
          titulo: 'Importação concluída',
          corpo: h('div', null,
            h('p', null, `${res.novas} páginas novas, ${res.atualizadas} atualizadas, ${r.imagens} imagens.`),
            h('ul', null, Object.entries(porTipo).map(([t, n]) => h('li', null, `${G.TIPOS[t].icone} ${G.TIPOS[t].plural}: ${n}`))),
            r.ignoradas ? h('p', { class: 'dica' }, `${r.ignoradas} páginas que eram só índices foram puladas.`) : null,
            r.avisos.length ? h('details', null, h('summary', null, r.avisos.length + ' avisos'), h('ul', { class: 'dica' }, r.avisos.slice(0, 40).map(a => h('li', null, a)))) : null,
            h('p', { class: 'dica' }, 'Página no tipo errado? Abra-a e use ⋯ → Mudar tipo.')),
          acoes: [{ texto: 'Ver biblioteca', primario: true, acao: (x) => { x(); G.ir('biblioteca'); } }]
        });
      } catch (e) { console.error(e); prog(''); G.aviso('Falha: ' + e.message, 'erro', 6000); }
    };
    const f = G.folha({
      titulo: 'Importar e exportar', cheia: true,
      corpo: h('div', null,
        h('h4', null, 'Do Notion'),
        h('ol', { class: 'passos' },
          h('li', null, 'No Notion (pelo computador), abra a página principal da campanha.'),
          h('li', null, '⋯ → Exportar → formato ', h('b', null, 'Markdown & CSV'), ', incluir ', h('b', null, 'subpáginas'), ' e ', h('b', null, 'criar pastas para subpáginas'), '.'),
          h('li', null, 'Escolha o .zip abaixo. Imagens, tags e links vêm junto. Pode importar de novo depois sem duplicar.')),
        h('h4', null, 'Do Grimório antigo (desktop)'),
        h('p', { class: 'dica' }, 'No app antigo: ⤓ → Exportar esta campanha (.grimorio). Depois escolha o arquivo abaixo.'),
        h('button', { class: 'btn primario largo', onclick: escolher }, '⤓ Escolher arquivo (.zip, .grimorio ou backup)'),
        status,
        h('hr'),
        h('h4', null, 'Backup'),
        h('button', { class: 'btn largo', onclick: () => exportarBackup().then(() => G.aviso('Backup baixado')) }, '⤒ Baixar backup desta campanha'))
    });
  };

  G._importar = { lerZip, importarNotion, lerCSV };
})();
