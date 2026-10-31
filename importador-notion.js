// Importador da exportação "Markdown & CSV" do Notion.
// Converte páginas e bancos de dados em páginas do Grimório, preservando textos, imagens e links internos.
const path = require('path').posix;
const crypto = require('crypto');
const { lerZip } = require('./zip');

const RE_ID = /\s+([0-9a-f]{32})$/i;
const EXT_IMG = /\.(png|jpe?g|gif|webp|bmp|svg|jfif|avif)$/i;
const TAGS_DE_TIPO = {
  npc: 'npc', npcs: 'npc', 'vilão': 'npc', vilao: 'npc',
  monstro: 'criatura', monstros: 'criatura', criatura: 'criatura',
  item: 'item', itens: 'item',
  mapas: 'local', mapa: 'local', local: 'local', locais: 'local', cidade: 'local',
  personagens: null, deity: null, divindade: null
};

const novoId = () => crypto.randomBytes(6).toString('hex');
const semId = (s) => s.replace(RE_ID, '').trim();
const idNotion = (s) => { const m = s.match(RE_ID); return m ? m[1].toLowerCase() : null; };
const limparTitulo = (s) => s.replace(/\s+/g, ' ').trim();

function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const linhas = []; let linha = []; let campo = ''; let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...resto] = linhas.filter(l => l.some(x => x.trim()));
  if (!cab) return [];
  return resto.map(l => Object.fromEntries(cab.map((h, i) => [h.trim(), (l[i] || '').trim()])));
}

// Expande zips dentro do zip (o Notion divide exportações grandes em partes)
function coletarArquivos(buf, prefixo = '', saida = new Map()) {
  for (const ent of lerZip(buf)) {
    if (ent.pasta) continue;
    if (/\.zip$/i.test(ent.nome)) coletarArquivos(ent.ler(), prefixo, saida);
    else saida.set(prefixo + ent.nome, ent);
  }
  return saida;
}

function ndDoNotion(valor) {
  if (!valor) return '';
  const v = String(valor).trim().replace(',', '.');
  if (/^\d+\/\d+$/.test(v)) return v;
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  if (n >= 1) return String(Math.round(n));
  if (n >= 0.45) return '1/2';
  if (n >= 0.3) return '1/3';
  if (n >= 0.2) return '1/4';
  if (n >= 0.15) return '1/6';
  return '1/8';
}

function tipoPorContexto(titulo, ancestrais, dbNome, tags) {
  const tagsMin = tags.map(t => t.toLowerCase().replace(/\.$/, ''));
  if (dbNome && /personage|jogador|party|grupo|her[oó]is/i.test(dbNome)) return 'jogador';
  for (const t of tagsMin) if (TAGS_DE_TIPO[t]) return TAGS_DE_TIPO[t];
  const caminho = [...ancestrais, dbNome || ''].join(' / ').toLowerCase();
  if (/sess[aã]o|sess[oõ]es|di[aá]rio/.test(titulo.toLowerCase())) return 'sessao';
  if (/miss[aã]o|miss[oõ]es|quest/.test(caminho) || /^miss[aã]o/i.test(titulo)) return 'missao';
  if (/cidade|local|locais|regi[aã]o|reino|mapa/.test(caminho)) return 'local';
  if (/fac[cç][aã]o|fac[cç][oõ]es|guilda|organiza/.test(caminho)) return 'faccao';
  if (/npc/.test(caminho)) return 'npc';
  if (/\bite(m|ns)\b/.test(caminho)) return 'item';
  if (/monstr|besti|criatura|vil[aã]o/.test(caminho)) return 'criatura';
  if (/sess/.test(caminho)) return 'sessao';
  return 'nota';
}

function importarExportNotion(zipBuffer, salvarImagem) {
  const arquivos = coletarArquivos(zipBuffer);
  const mds = [...arquivos.keys()].filter(k => /\.md$/i.test(k));
  const csvs = [...arquivos.keys()].filter(k => /\.csv$/i.test(k) && !/_all\.csv$/i.test(k));
  const avisos = [];
  if (!mds.length) throw new Error('Nenhuma página encontrada. Exporte do Notion no formato "Markdown & CSV".');

  // Bancos de dados: pasta com o mesmo nome do .csv contém as linhas
  const bancos = new Map(); // pasta -> { nome, linhasPorTitulo }
  for (const c of csvs) {
    const base = c.replace(/\.csv$/i, '');
    let linhas = [];
    try { linhas = lerCSV(arquivos.get(c).ler().toString('utf8')); } catch { avisos.push('Não consegui ler a tabela ' + c); }
    const colTitulo = linhas[0] ? Object.keys(linhas[0])[0] : null;
    const porTitulo = new Map(linhas.map(l => [limparTitulo(l[colTitulo] || ''), l]));
    bancos.set(base, { nome: semId(path.basename(base)), porTitulo });
  }

  // 1ª passada: metadados de cada página
  const paginas = mds.map(caminho => {
    const texto = arquivos.get(caminho).ler().toString('utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
    const nomeArq = path.basename(caminho).replace(/\.md$/i, '');
    const linhas = texto.split('\n');
    let titulo = semId(nomeArq);
    let i = 0;
    while (i < linhas.length && !linhas[i].trim()) i++;
    if (linhas[i] && /^#\s+/.test(linhas[i])) { titulo = linhas[i].replace(/^#\s+/, ''); i++; }
    titulo = limparTitulo(titulo) || 'Sem título';

    const pasta = path.dirname(caminho);
    const banco = bancos.get(pasta) || null;
    // Propriedades no formato "Chave: valor" logo após o título
    const props = {};
    let j = i;
    while (j < linhas.length && !linhas[j].trim()) j++;
    if (banco || /^(Tags|Tag|Etiquetas|Created|Criado em|Status|Tipo|Type)\s*:/i.test(linhas[j] || '')) {
      while (j < linhas.length && /^[^\s:#>\-*|!\[][^:]{0,40}:\s?/.test(linhas[j])) {
        const k = linhas[j].indexOf(':');
        props[linhas[j].slice(0, k).trim()] = linhas[j].slice(k + 1).trim();
        j++;
      }
      if (Object.keys(props).length) i = j;
    }
    if (banco && banco.porTitulo.has(titulo)) {
      for (const [k, v] of Object.entries(banco.porTitulo.get(titulo))) if (!(k in props) && v) props[k] = v;
    }

    const ancestrais = pasta === '.' ? [] : pasta.split('/').map(semId);
    return {
      caminho, pasta, titulo, props, banco,
      corpoBruto: linhas.slice(i).join('\n').trim(),
      notionId: idNotion(nomeArq),
      ancestrais,
      temFilhos: mds.some(m => m.startsWith(caminho.replace(/\.md$/i, '') + '/')),
      id: novoId()
    };
  });

  const porCaminho = new Map(paginas.map(p => [p.caminho, p]));
  let totalImagens = 0;
  const imagensSalvas = new Map();

  function resolverRelativo(base, alvo) {
    let a = alvo.split('#')[0];
    try { a = decodeURIComponent(a); } catch { /* mantém */ }
    return path.normalize(path.join(base, a));
  }

  function converterCorpo(p) {
    let md = p.corpoBruto;
    // Blocos <aside> (callouts) viram citações
    md = md.replace(/<aside>([\s\S]*?)<\/aside>/g, (_, dentro) =>
      dentro.trim().split('\n').map(l => '> ' + l.replace(/<[^>]+>/g, '')).join('\n'));
    // Imagens locais
    md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (tudo, alt, alvo) => {
      if (/^https?:/i.test(alvo)) return tudo;
      const real = resolverRelativo(p.pasta, alvo);
      const ent = arquivos.get(real);
      if (!ent || !EXT_IMG.test(real)) { avisos.push(`Imagem não encontrada em "${p.titulo}": ${alvo}`); return ''; }
      if (!imagensSalvas.has(real)) { imagensSalvas.set(real, salvarImagem(path.basename(real), ent.ler())); totalImagens++; }
      const legenda = alt && !EXT_IMG.test(alt) && !/^image$/i.test(alt) ? alt : '';
      return `![${legenda}](img:${imagensSalvas.get(real)})`;
    });
    // Links para outras páginas viram [[links internos]]
    md = md.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, (tudo, texto, alvo) => {
      if (/^(https?:|mailto:)/i.test(alvo)) return tudo;
      const real = resolverRelativo(p.pasta, alvo);
      const destino = porCaminho.get(real);
      if (destino) return destino.titulo === texto || !texto ? `[[${destino.titulo}]]` : `[[${destino.titulo}|${texto}]]`;
      if (/\.csv$/i.test(real)) return texto;
      if (arquivos.has(real) && !EXT_IMG.test(real)) return texto + ' (anexo não importado)';
      return texto;
    });
    // Limpa tags HTML residuais simples
    md = md.replace(/<\/?(span|div|details|summary|br)[^>]*>/gi, '');
    return md.replace(/\n{3,}/g, '\n\n').trim();
  }

  const entidades = [];
  const faccoes = new Map();
  const porTipo = {};
  let ignoradas = 0;

  for (const p of paginas) {
    const tagsBrutas = (p.props.Tags || p.props.Tag || p.props.Etiquetas || '')
      .split(',').map(t => t.trim()).filter(Boolean);
    const tipo = tipoPorContexto(p.titulo, p.ancestrais, p.banco && p.banco.nome, tagsBrutas);
    const corpo = converterCorpo(p);

    // Páginas que só servem de índice (lista de subpáginas) não precisam virar páginas
    const conteudoReal = corpo.replace(/\[\[[^\]]+\]\]/g, '').replace(/[\s\-*#>]/g, '');
    if (p.temFilhos && conteudoReal.length < 30 && !p.banco) { ignoradas++; continue; }

    const campos = {};
    const tags = [];
    let faccaoNome = null;
    for (const t of tagsBrutas) {
      const tl = t.toLowerCase().replace(/\.$/, '');
      if (tl in TAGS_DE_TIPO) { if (TAGS_DE_TIPO[tl] === null) tags.push(t.replace(/\.$/, '')); continue; }
      const limpo = t.replace(/\.$/, '').trim();
      if (tipo === 'npc' && !faccaoNome) faccaoNome = limpo;
      tags.push(limpo);
    }
    const P = (k) => p.props[k] || '';
    if (tipo === 'jogador') {
      Object.assign(campos, {
        jogador: P('Player') || P('Jogador'), ca: P('CA'), iniciativa: P('Iniciativa'),
        percepcao: P('Percepção'), link: P('Link'), idiomas: P('Idiomas')
      });
    }
    if (tipo === 'criatura') campos.nd = ndDoNotion(P('Nível de desafio') || P('ND') || P('CR'));
    if (faccaoNome) {
      if (!faccoes.has(faccaoNome)) faccoes.set(faccaoNome, novoId());
      campos.faccao = faccoes.get(faccaoNome);
    }

    const primeiraImagem = corpo.match(/!\[[^\]]*\]\((img:[^)]+)\)/);
    // Se a página começa com uma imagem, ela vira a capa (e sai do texto para não aparecer duas vezes)
    let corpoFinal = corpo;
    if (primeiraImagem && corpo.indexOf(primeiraImagem[0]) === 0) corpoFinal = corpo.slice(primeiraImagem[0].length).trim();
    entidades.push({
      id: p.id, tipo, titulo: p.titulo, campos, tags, corpo: corpoFinal,
      capa: primeiraImagem ? primeiraImagem[1] : '',
      notionId: p.notionId, origem: 'notion',
      criado: Date.now(), editado: Date.now()
    });
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  }

  // Facções criadas a partir das tags (ex.: "Escrituras.", "Corp Kafra.")
  for (const [nome, id] of faccoes) {
    const existente = entidades.find(e => e.tipo === 'faccao' && e.titulo.toLowerCase() === nome.toLowerCase());
    if (existente) {
      for (const e of entidades) if (e.campos.faccao === id) e.campos.faccao = existente.id;
      continue;
    }
    entidades.push({
      id, tipo: 'faccao', titulo: nome, campos: {}, tags: [],
      corpo: 'Facção criada a partir da tag do Notion. Os membros aparecem abaixo.',
      capa: '', notionId: null, origem: 'notion', criado: Date.now(), editado: Date.now()
    });
    porTipo.faccao = (porTipo.faccao || 0) + 1;
  }

  const raiz = paginas.find(p => p.ancestrais.length === 0);
  return {
    campanhaNome: raiz ? raiz.titulo : 'Campanha importada',
    entidades,
    relatorio: { paginas: entidades.length, imagens: totalImagens, porTipo, ignoradas, avisos: avisos.slice(0, 50) }
  };
}

module.exports = { importarExportNotion, lerCSV, ndDoNotion };
