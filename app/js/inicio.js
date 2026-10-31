// Inicialização: abre a última campanha usada (ou a tela de campanhas)
(async function () {
  try {
    const lista = await G.arm.listar();
    let ultima = null;
    try { ultima = localStorage.getItem('grimorio:ultima'); } catch { /* ignora */ }
    const alvo = lista.find(c => c.id === ultima) || (lista.length === 1 ? lista[0] : null);
    if (alvo) {
      await G.estado.abrir(alvo.id);
      G.aplicarTema();
      G.recarregarRota();
    } else {
      G.mostrarCampanhas();
    }
  } catch (e) {
    console.error(e);
    G.mostrarCampanhas();
  }
})();
