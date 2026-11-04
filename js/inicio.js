// Inicialização: escolhe o armazenamento, faz login e abre a última campanha
(async function () {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  const tela = document.getElementById('conteudo');
  tela.innerHTML = '<div class="carregando">✦<br>Abrindo o grimório…</div>';

  if (window.FIREBASE_CONFIG) {
    try {
      const { criarArmazenamentoFirebase } = await import('./armazenamento-firebase.js');
      G.arm = await criarArmazenamentoFirebase(window.FIREBASE_CONFIG);
    } catch (e) {
      console.error(e);
      tela.innerHTML = '';
      G.arm = G.armLocal;
      G.aviso('Não consegui carregar a sincronização (sem internet?). Abrindo em modo local.', 'erro', 6000);
    }
  } else {
    G.arm = G.armLocal;
  }

  const ultima = () => { try { return localStorage.getItem('gm:ultima:' + (G.arm.usuario ? G.arm.usuario.uid : '')); } catch { return null; } };

  async function aoEntrar() {
    if (!G.arm.usuario) { G.loja.fechar(); document.body.classList.add('sem-campanha'); G.ir('conta'); return; }
    const id = ultima();
    if (id) {
      try { await G.loja.abrir(id); document.body.classList.remove('sem-campanha'); G.renderizar(); return; } catch { /* campanha apagada */ }
    }
    const lista = await G.arm.listarCampanhas().catch(() => []);
    if (lista.length === 1) { await G.loja.abrir(lista[0].id); document.body.classList.remove('sem-campanha'); G.renderizar(); return; }
    document.body.classList.add('sem-campanha');
    G.ir('conta');
  }

  await G.arm.iniciar();
  await aoEntrar();
  if (G.arm.tipo === 'firebase') {
    let primeiro = true;
    G.arm.aoMudarUsuario(() => { if (primeiro) { primeiro = false; return; } aoEntrar(); });
  }
})();
