// Armazenamento local (modo sem conta): textos no localStorage, imagens no IndexedDB deste aparelho
G.armLocal = (function () {
  const L = window.localStorage;
  const ler = (k, padrao) => { try { const v = L.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } };
  const gravar = (k, v) => L.setItem(k, JSON.stringify(v));
  const ouvintes = {};
  const avisar = (campId) => (ouvintes[campId] || []).forEach(o => { o.meta && o.meta(ler('gm:camp:' + campId, null)); o.entidades && o.entidades(ler('gm:ents:' + campId, {})); });

  // IndexedDB mínimo para imagens
  let bancoP = null;
  const banco = () => bancoP || (bancoP = new Promise((ok, falha) => {
    const r = indexedDB.open('grimorio-imagens', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('imagens');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => falha(r.error);
  }));
  const idb = async (modo, fn) => { const db = await banco(); return new Promise((ok, falha) => { const tx = db.transaction('imagens', modo); const req = fn(tx.objectStore('imagens')); tx.oncomplete = () => ok(req && req.result); tx.onerror = () => falha(tx.error); }); };

  return {
    tipo: 'local',
    usuario: { uid: 'local', email: 'este aparelho' },
    async iniciar() { return this.usuario; },
    aoMudarUsuario(cb) { cb(this.usuario); },
    async entrar() { throw new Error('Sincronização desligada: configure o Firebase em config.js'); },
    async criarConta() { throw new Error('Sincronização desligada'); },
    async sair() {},
    async listarCampanhas() {
      return ler('gm:camps', []).map(id => ler('gm:camp:' + id, null)).filter(Boolean)
        .map(c => ({ id: c.id, nome: c.nome, editado: c.editado || 0 })).sort((a, b) => b.editado - a.editado);
    },
    async criarCampanha(meta) {
      const id = G.uid();
      gravar('gm:camp:' + id, Object.assign({}, meta, { id, editado: Date.now() }));
      gravar('gm:ents:' + id, {});
      gravar('gm:camps', [...ler('gm:camps', []), id]);
      return id;
    },
    async excluirCampanha(id) {
      L.removeItem('gm:camp:' + id); L.removeItem('gm:ents:' + id);
      gravar('gm:camps', ler('gm:camps', []).filter(x => x !== id));
    },
    observar(campId, cbs) {
      (ouvintes[campId] = ouvintes[campId] || []).push(cbs);
      setTimeout(() => { cbs.meta && cbs.meta(ler('gm:camp:' + campId, null)); cbs.entidades && cbs.entidades(ler('gm:ents:' + campId, {})); }, 0);
      return () => { ouvintes[campId] = (ouvintes[campId] || []).filter(o => o !== cbs); };
    },
    async salvarMeta(campId, parcial) {
      const m = Object.assign(ler('gm:camp:' + campId, {}), parcial, { editado: Date.now() });
      gravar('gm:camp:' + campId, m);
    },
    async salvarEntidade(campId, ent) {
      const mapa = ler('gm:ents:' + campId, {}); mapa[ent.id] = ent; gravar('gm:ents:' + campId, mapa);
      this.salvarMeta(campId, {});
    },
    async salvarEntidadesEmLote(campId, lista) {
      const mapa = ler('gm:ents:' + campId, {}); lista.forEach(e => { mapa[e.id] = e; }); gravar('gm:ents:' + campId, mapa);
      this.salvarMeta(campId, {}); avisar(campId);
    },
    async excluirEntidade(campId, id) {
      const mapa = ler('gm:ents:' + campId, {}); delete mapa[id]; gravar('gm:ents:' + campId, mapa);
    },
    async salvarImagem(campId, dataURL) { const id = G.uid(); await idb('readwrite', s => s.put(dataURL, campId + ':' + id)); return id; },
    async obterImagem(campId, id) { return idb('readonly', s => s.get(campId + ':' + id)); }
  };
})();
