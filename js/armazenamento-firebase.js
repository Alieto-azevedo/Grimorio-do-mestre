// Armazenamento na nuvem (Firebase Auth + Firestore), com cache offline no aparelho.
// Estrutura: usuarios/{uid}/campanhas/{campId}  (+ subcoleções entidades/ e imagens/)
const V = '10.14.1';
const BASE = `https://www.gstatic.com/firebasejs/${V}/`;

export async function criarArmazenamentoFirebase(config) {
  const { initializeApp } = await import(BASE + 'firebase-app.js');
  const A = await import(BASE + 'firebase-auth.js');
  const F = await import(BASE + 'firebase-firestore.js');

  const app = initializeApp(config);
  const auth = A.getAuth(app);
  await A.setPersistence(auth, A.browserLocalPersistence);
  let db;
  try {
    db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  } catch {
    db = F.getFirestore(app);
  }

  const limpo = (o) => JSON.parse(JSON.stringify(o)); // Firestore não aceita undefined
  const uid = () => { if (!auth.currentUser) throw new Error('Faça login primeiro'); return auth.currentUser.uid; };
  const colCamps = () => F.collection(db, 'usuarios', uid(), 'campanhas');
  const docCamp = (id) => F.doc(db, 'usuarios', uid(), 'campanhas', id);
  const colEnts = (id) => F.collection(db, 'usuarios', uid(), 'campanhas', id, 'entidades');
  const cacheImg = new Map();

  const arm = {
    tipo: 'firebase',
    usuario: null,
    iniciar() {
      return new Promise(ok => {
        const parar = A.onAuthStateChanged(auth, (u) => { arm.usuario = u ? { uid: u.uid, email: u.email } : null; parar(); ok(arm.usuario); });
      });
    },
    aoMudarUsuario(cb) { return A.onAuthStateChanged(auth, (u) => { arm.usuario = u ? { uid: u.uid, email: u.email } : null; cb(arm.usuario); }); },
    async entrar(email, senha) { await A.signInWithEmailAndPassword(auth, email, senha); },
    async criarConta(email, senha) { await A.createUserWithEmailAndPassword(auth, email, senha); },
    async redefinirSenha(email) { await A.sendPasswordResetEmail(auth, email); },
    async sair() { await A.signOut(auth); },

    async listarCampanhas() {
      const snap = await F.getDocs(colCamps());
      return snap.docs.map(d => ({ id: d.id, nome: d.data().nome, editado: d.data().editado || 0 })).sort((a, b) => b.editado - a.editado);
    },
    async criarCampanha(meta) {
      const ref = F.doc(colCamps());
      await F.setDoc(ref, limpo(Object.assign({}, meta, { id: ref.id, editado: Date.now() })));
      return ref.id;
    },
    async excluirCampanha(id) {
      // Apaga entidades e imagens em lotes, depois a campanha
      for (const sub of ['entidades', 'imagens']) {
        const snap = await F.getDocs(F.collection(db, 'usuarios', uid(), 'campanhas', id, sub));
        for (let i = 0; i < snap.docs.length; i += 400) {
          const lote = F.writeBatch(db);
          snap.docs.slice(i, i + 400).forEach(d => lote.delete(d.ref));
          await lote.commit();
        }
      }
      await F.deleteDoc(docCamp(id));
    },
    observar(campId, cbs) {
      const mapa = {};
      const p1 = F.onSnapshot(docCamp(campId), { includeMetadataChanges: true }, (s) => {
        cbs.meta && cbs.meta(s.exists() ? s.data() : null, { local: s.metadata.hasPendingWrites });
        cbs.status && cbs.status(s.metadata.hasPendingWrites ? 'pendente' : (s.metadata.fromCache ? 'offline' : 'ok'));
      }, (e) => cbs.erro && cbs.erro(e));
      const p2 = F.onSnapshot(colEnts(campId), (s) => {
        s.docChanges().forEach(m => { if (m.type === 'removed') delete mapa[m.doc.id]; else mapa[m.doc.id] = m.doc.data(); });
        cbs.entidades && cbs.entidades(Object.assign({}, mapa));
      }, (e) => cbs.erro && cbs.erro(e));
      return () => { p1(); p2(); };
    },
    salvarMeta: (campId, parcial) => F.setDoc(docCamp(campId), limpo(Object.assign({}, parcial, { editado: Date.now() })), { merge: true }),
    salvarEntidade: (campId, ent) => F.setDoc(F.doc(colEnts(campId), ent.id), limpo(ent)),
    async salvarEntidadesEmLote(campId, lista) {
      for (let i = 0; i < lista.length; i += 300) {
        const lote = F.writeBatch(db);
        lista.slice(i, i + 300).forEach(e => lote.set(F.doc(colEnts(campId), e.id), limpo(e)));
        await lote.commit();
      }
      await arm.salvarMeta(campId, {});
    },
    excluirEntidade: (campId, id) => F.deleteDoc(F.doc(colEnts(campId), id)),
    async salvarImagem(campId, dataURL) {
      const ref = F.doc(F.collection(db, 'usuarios', uid(), 'campanhas', campId, 'imagens'));
      await F.setDoc(ref, { dados: dataURL, criado: Date.now() });
      cacheImg.set(ref.id, dataURL);
      return ref.id;
    },
    async obterImagem(campId, id) {
      if (cacheImg.has(id)) return cacheImg.get(id);
      const s = await F.getDoc(F.doc(db, 'usuarios', uid(), 'campanhas', campId, 'imagens', id));
      const v = s.exists() ? s.data().dados : '';
      cacheImg.set(id, v);
      return v;
    }
  };
  return arm;
}
