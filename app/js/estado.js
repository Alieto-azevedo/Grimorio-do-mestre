// Estado da campanha aberta + eventos + salvamento automático
(function () {
  const ouvintes = {};
  G.on = (evt, fn) => { (ouvintes[evt] = ouvintes[evt] || []).push(fn); return () => { ouvintes[evt] = ouvintes[evt].filter(f => f !== fn); }; };
  G.emitir = (evt, dado) => (ouvintes[evt] || []).slice().forEach(fn => { try { fn(dado); } catch (e) { console.error(e); } });
})();

G.estado = (function () {
  let camp = null;
  let indiceTitulos = new Map();
  let salvando = false;

  function campanhaVazia(nome) {
    return {
      versao: 1, nome, sistema: 'Pathfinder 1e', criada: Date.now(), editado: Date.now(),
      entidades: {},
      iniciativa: { rodada: 1, turno: 0, iniciado: false, participantes: [] },
      mesa: { sessaoId: null, emCena: [] },
      config: { tema: 'taverna' }
    };
  }

  function reindexar() {
    indiceTitulos = new Map();
    for (const e of Object.values(camp.entidades)) indiceTitulos.set(G.normalizar(e.titulo), e);
  }

  const salvarDebounced = G.debounce(async () => {
    if (!camp) return;
    salvando = true;
    G.emitir('salvando', true);
    try {
      camp.editado = Date.now();
      await G.arm.salvar(camp.id, camp);
      G.emitir('salvo', Date.now());
    } catch (e) {
      console.error(e);
      G.aviso('Erro ao salvar: ' + e.message, 'erro');
    } finally { salvando = false; }
  }, 500);

  window.addEventListener('beforeunload', () => { if (camp) salvarDebounced.agora(); });

  const api = {
    get camp() { return camp; },
    campanhaVazia,

    async abrir(id) {
      const dados = await G.arm.carregar(id);
      if (!dados) throw new Error('Campanha não encontrada');
      dados.id = id;
      const base = campanhaVazia(dados.nome);
      camp = Object.assign(base, dados);
      camp.iniciativa = Object.assign(base.iniciativa, dados.iniciativa || {});
      camp.mesa = Object.assign(base.mesa, dados.mesa || {});
      camp.config = Object.assign(base.config, dados.config || {});
      reindexar();
      try { localStorage.setItem('grimorio:ultima', id); } catch { /* ignora */ }
      G.emitir('campanha', camp);
      return camp;
    },
    fechar() { salvarDebounced.agora(); camp = null; },
    salvar: () => salvarDebounced(),
    salvarAgora: () => salvarDebounced.agora(),

    lista(tipo) {
      if (!camp) return [];
      const todas = Object.values(camp.entidades);
      return (tipo ? todas.filter(e => e.tipo === tipo) : todas);
    },
    obter: (id) => camp && camp.entidades[id],
    porTitulo: (titulo) => indiceTitulos.get(G.normalizar(titulo)) || null,

    criar(tipo, dados = {}) {
      const def = G.TIPOS[tipo];
      const e = {
        id: G.uid(), tipo, titulo: dados.titulo || `${def.nome} sem título`,
        campos: dados.campos || {}, tags: dados.tags || [],
        corpo: dados.corpo !== undefined ? dados.corpo : def.modelo,
        capa: dados.capa || '', criado: Date.now(), editado: Date.now()
      };
      if (tipo === 'sessao' && !e.campos.numero) {
        const nums = api.lista('sessao').map(s => +s.campos.numero || 0);
        e.campos.numero = (nums.length ? Math.max(...nums) : 0) + 1;
        if (!dados.titulo) e.titulo = `Sessão ${e.campos.numero}`;
        if (!e.campos.status) e.campos.status = 'Planejada';
      }
      camp.entidades[e.id] = e;
      reindexar();
      api.salvar();
      G.emitir('entidades', { acao: 'criar', id: e.id });
      return e;
    },

    atualizar(id, mudancas, opcoes = {}) {
      const e = camp.entidades[id];
      if (!e) return null;
      const tituloAntigo = e.titulo;
      Object.assign(e, mudancas, { editado: Date.now() });
      if (mudancas.campos) e.campos = Object.assign({}, mudancas.campos);
      if (mudancas.titulo !== undefined && mudancas.titulo !== tituloAntigo) {
        // Renomear atualiza os [[links]] nas outras páginas
        const re = new RegExp('\\[\\[' + tituloAntigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\|[^\\]]+)?\\]\\]', 'gi');
        for (const outra of Object.values(camp.entidades)) {
          if (outra.corpo) outra.corpo = outra.corpo.replace(re, (_, apelido) => `[[${e.titulo}${apelido || ''}]]`);
        }
        reindexar();
      }
      api.salvar();
      if (!opcoes.silencioso) G.emitir('entidades', { acao: 'atualizar', id });
      return e;
    },

    excluir(id) {
      delete camp.entidades[id];
      for (const e of Object.values(camp.entidades)) {
        for (const [k, v] of Object.entries(e.campos || {})) if (v === id) e.campos[k] = '';
      }
      camp.mesa.emCena = camp.mesa.emCena.filter(x => x !== id);
      if (camp.mesa.sessaoId === id) camp.mesa.sessaoId = null;
      reindexar();
      api.salvar();
      G.emitir('entidades', { acao: 'excluir', id });
    },

    duplicar(id) {
      const o = camp.entidades[id];
      const copia = JSON.parse(JSON.stringify(o));
      copia.titulo = o.titulo + ' (cópia)';
      delete copia.notionId;
      return api.criar(o.tipo, copia);
    },

    // Páginas que citam esta (por [[link]] ou por campo de relação)
    mencoes(id) {
      const e = camp.entidades[id];
      if (!e) return [];
      const alvo = G.normalizar(e.titulo);
      return Object.values(camp.entidades).filter(o => {
        if (o.id === id) return false;
        if (Object.values(o.campos || {}).includes(id)) return true;
        return G.md.links(o.corpo).some(t => G.normalizar(t) === alvo);
      });
    },

    // Importação (Notion/backup): atualiza o que já existe e acrescenta o resto
    importarEntidades(novas) {
      const mapaIds = {};
      let criadas = 0, atualizadas = 0;
      for (const n of novas) {
        const existente = Object.values(camp.entidades).find(e =>
          (n.notionId && e.notionId === n.notionId) ||
          (e.tipo === n.tipo && G.normalizar(e.titulo) === G.normalizar(n.titulo)));
        if (existente) {
          mapaIds[n.id] = existente.id;
          Object.assign(existente, {
            corpo: n.corpo || existente.corpo,
            capa: existente.capa || n.capa,
            tags: [...new Set([...(existente.tags || []), ...(n.tags || [])])],
            campos: Object.assign({}, n.campos, Object.fromEntries(Object.entries(existente.campos || {}).filter(([, v]) => v !== '' && v != null))),
            notionId: n.notionId || existente.notionId,
            editado: Date.now()
          });
          atualizadas++;
        } else {
          camp.entidades[n.id] = Object.assign({ campos: {}, tags: [], corpo: '', capa: '' }, n);
          mapaIds[n.id] = n.id;
          criadas++;
        }
      }
      for (const e of Object.values(camp.entidades)) {
        for (const [k, v] of Object.entries(e.campos || {})) if (mapaIds[v] && mapaIds[v] !== v) e.campos[k] = mapaIds[v];
      }
      reindexar();
      api.salvarAgora();
      G.emitir('entidades', { acao: 'importar' });
      return { criadas, atualizadas };
    },

    urlImagem: (ref) => (ref ? G.arm.urlImagem(camp.id, ref) : ''),
    get salvando() { return salvando; }
  };
  return api;
})();
