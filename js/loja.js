// Estado da campanha aberta, sincronizado com o armazenamento (local ou Firebase)
(function () {
  const ouvintes = {};
  G.on = (evt, fn) => { (ouvintes[evt] = ouvintes[evt] || []).push(fn); return () => { ouvintes[evt] = (ouvintes[evt] || []).filter(f => f !== fn); }; };
  G.emitir = (evt, dado) => (ouvintes[evt] || []).slice().forEach(fn => { try { fn(dado); } catch (e) { console.error(e); } });
})();

G.loja = (function () {
  let campId = null;
  let meta = null;
  let ents = {};
  let indice = new Map();
  let pararObservacao = null;
  const sujos = new Map();   // entidades com gravação pendente (não deixar o servidor sobrescrever)
  let metaSuja = false;
  const imagens = new Map();

  const metaPadrao = (nome) => ({
    nome, sistema: 'Pathfinder 1e', criada: Date.now(),
    iniciativa: { rodada: 1, turno: 0, iniciado: false, participantes: [], log: [] },
    mesa: { sessaoId: null, emCena: [] },
    config: { recentes: [], macros: ['1d20', '1d20+5', '2d6', '1d8+3', '4d6kh3'] }
  });

  function reindexar() {
    indice = new Map();
    for (const e of Object.values(ents)) indice.set(G.normalizar(e.titulo), e);
  }

  const gravarMeta = G.debounce(async () => {
    metaSuja = false;
    try { await G.arm.salvarMeta(campId, { nome: meta.nome, iniciativa: meta.iniciativa, mesa: meta.mesa, config: meta.config }); }
    catch (e) { G.aviso('Erro ao salvar: ' + e.message, 'erro'); }
  }, 600);

  function gravarEntidade(id) {
    if (!sujos.has(id)) sujos.set(id, G.debounce(async () => {
      const e = ents[id];
      try { if (e) await G.arm.salvarEntidade(campId, e); }
      catch (err) { G.aviso('Erro ao salvar: ' + err.message, 'erro'); }
      finally { sujos.delete(id); }
    }, 700));
    sujos.get(id)();
  }

  const api = {
    get id() { return campId; },
    get meta() { return meta; },
    metaPadrao,

    async abrir(id) {
      api.fechar();
      campId = id;
      ents = {}; indice = new Map(); meta = null;
      try { localStorage.setItem('gm:ultima:' + (G.arm.usuario ? G.arm.usuario.uid : ''), id); } catch { /* ignora */ }
      return new Promise((ok, falha) => {
        let pronto = { meta: false, ents: false };
        const talvezPronto = () => { if (pronto.meta && pronto.ents && ok) { ok(meta); ok = null; } };
        pararObservacao = G.arm.observar(id, {
          meta: (m, info) => {
            if (!m) { if (ok) { falha(new Error('Campanha não encontrada')); ok = null; } return; }
            if (!metaSuja && !(pronto.meta && info && info.local)) {
              const base = metaPadrao(m.nome);
              meta = Object.assign(base, m);
              meta.iniciativa = Object.assign(base.iniciativa, m.iniciativa || {});
              meta.mesa = Object.assign(base.mesa, m.mesa || {});
              meta.config = Object.assign(base.config, m.config || {});
              if (pronto.meta) G.emitir('meta', meta);
            }
            pronto.meta = true; talvezPronto();
          },
          entidades: (mapa) => {
            for (const id2 of sujos.keys()) if (ents[id2]) mapa[id2] = ents[id2];
            ents = mapa;
            reindexar();
            if (pronto.ents) G.emitir('entidades', { remoto: true });
            pronto.ents = true; talvezPronto();
          },
          status: (s) => G.emitir('sinc', s),
          erro: (e) => G.aviso('Sincronização: ' + e.message, 'erro', 6000)
        });
      });
    },
    fechar() {
      gravarMeta.agora();
      for (const d of sujos.values()) d.agora();
      if (pararObservacao) pararObservacao();
      pararObservacao = null; campId = null; meta = null; ents = {};
    },
    salvarMeta() { metaSuja = true; gravarMeta(); },
    salvarTudoAgora() { gravarMeta.agora(); for (const d of sujos.values()) d.agora(); },

    lista: (tipo) => Object.values(ents).filter(e => !tipo || e.tipo === tipo),
    obter: (id) => ents[id] || null,
    porTitulo: (t) => indice.get(G.normalizar(t)) || null,

    criar(tipo, dados = {}) {
      const def = G.TIPOS[tipo];
      const e = {
        id: G.uid(), tipo, titulo: dados.titulo || `${def.nome} sem título`,
        campos: dados.campos || {}, tags: dados.tags || [],
        corpo: dados.corpo !== undefined ? dados.corpo : def.modelo,
        capa: dados.capa || '', ficha: dados.ficha || null,
        criado: Date.now(), editado: Date.now()
      };
      if (tipo === 'sessao' && !e.campos.numero) {
        const nums = api.lista('sessao').map(s => +s.campos.numero || 0);
        e.campos.numero = (nums.length ? Math.max(...nums) : 0) + 1;
        if (!dados.titulo) e.titulo = `Sessão ${e.campos.numero}`;
        e.campos.status = e.campos.status || 'Planejada';
      }
      ents[e.id] = e;
      reindexar();
      gravarEntidade(e.id);
      G.emitir('entidades', { id: e.id });
      return e;
    },

    atualizar(id, mudancas, { silencioso = false } = {}) {
      const e = ents[id];
      if (!e) return null;
      const antigo = e.titulo;
      Object.assign(e, mudancas, { editado: Date.now() });
      if (mudancas.titulo !== undefined && mudancas.titulo !== antigo) {
        const re = new RegExp('\\[\\[' + antigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\|[^\\]]+)?\\]\\]', 'gi');
        for (const o of Object.values(ents)) {
          if (o.corpo && o.id !== id) {
            const novo = o.corpo.replace(re, (_, ap) => `[[${e.titulo}${ap || ''}]]`);
            if (novo !== o.corpo) { o.corpo = novo; gravarEntidade(o.id); }
          }
        }
        reindexar();
      }
      gravarEntidade(id);
      if (!silencioso) G.emitir('entidades', { id });
      return e;
    },

    excluir(id) {
      delete ents[id];
      if (sujos.has(id)) sujos.delete(id);
      G.arm.excluirEntidade(campId, id).catch(e => G.aviso(e.message, 'erro'));
      for (const e of Object.values(ents)) {
        let mudou = false;
        for (const [k, v] of Object.entries(e.campos || {})) if (v === id) { e.campos[k] = ''; mudou = true; }
        if (mudou) gravarEntidade(e.id);
      }
      meta.mesa.emCena = meta.mesa.emCena.filter(x => x !== id);
      if (meta.mesa.sessaoId === id) meta.mesa.sessaoId = null;
      api.salvarMeta();
      reindexar();
      G.emitir('entidades', { id, excluida: true });
    },

    duplicar(id) {
      const c = JSON.parse(JSON.stringify(ents[id]));
      c.titulo += ' (cópia)';
      delete c.notionId;
      return api.criar(c.tipo, c);
    },

    mencoes(id) {
      const e = ents[id];
      if (!e) return [];
      const alvo = G.normalizar(e.titulo);
      return Object.values(ents).filter(o => o.id !== id && (Object.values(o.campos || {}).includes(id) || G.md.links(o.corpo).some(t => G.normalizar(t) === alvo)));
    },

    // Importação: atualiza o que já existe (mesmo ID do Notion ou mesmo tipo+título) e acrescenta o resto
    async importar(novas) {
      const mapaIds = {};
      const gravar = [];
      let novasQtd = 0;
      for (const n of novas) {
        const ex = Object.values(ents).find(e => (n.notionId && e.notionId === n.notionId) || (e.tipo === n.tipo && G.normalizar(e.titulo) === G.normalizar(n.titulo)));
        if (ex) {
          mapaIds[n.id] = ex.id;
          Object.assign(ex, {
            corpo: n.corpo || ex.corpo, capa: ex.capa || n.capa, ficha: ex.ficha || n.ficha || null,
            tags: [...new Set([...(ex.tags || []), ...(n.tags || [])])],
            campos: Object.assign({}, n.campos, Object.fromEntries(Object.entries(ex.campos || {}).filter(([, v]) => v !== '' && v != null))),
            notionId: n.notionId || ex.notionId || null, editado: Date.now()
          });
          gravar.push(ex);
        } else {
          const e = Object.assign({ campos: {}, tags: [], corpo: '', capa: '', ficha: null, criado: Date.now(), editado: Date.now() }, n);
          ents[e.id] = e; mapaIds[n.id] = e.id; gravar.push(e); novasQtd++;
        }
      }
      for (const e of gravar) for (const [k, v] of Object.entries(e.campos || {})) if (mapaIds[v] && mapaIds[v] !== v) e.campos[k] = mapaIds[v];
      reindexar();
      await G.arm.salvarEntidadesEmLote(campId, gravar);
      G.emitir('entidades', { importacao: true });
      return { total: gravar.length, novas: novasQtd, atualizadas: gravar.length - novasQtd };
    },

    // Imagens: refs no formato "img:<id>"
    async salvarImagem(arquivoOuDataURL) {
      const dados = typeof arquivoOuDataURL === 'string' ? arquivoOuDataURL : await G.comprimirImagem(arquivoOuDataURL);
      const id = await G.arm.salvarImagem(campId, dados);
      imagens.set(id, dados);
      return 'img:' + id;
    },
    async urlImagem(ref) {
      if (!ref) return '';
      if (!ref.startsWith('img:')) return /^(https?:|data:)/.test(ref) ? ref : '';
      const id = ref.slice(4);
      if (!imagens.has(id)) imagens.set(id, G.arm.obterImagem(campId, id).catch(() => ''));
      return imagens.get(id);
    }
  };
  return api;
})();

// Carrega imagens "img:" de forma assíncrona em qualquer trecho renderizado
G.hidratarImagens = function (raiz) {
  G.$$('img[data-ref]', raiz).forEach(async (img) => {
    const url = await G.loja.urlImagem(img.dataset.ref);
    if (url) img.src = url; else img.classList.add('quebrada');
  });
};
G.imgRef = (ref, attrs = {}) => G.h('img', Object.assign({ dataset: { ref }, alt: '', loading: 'lazy' }, attrs));
