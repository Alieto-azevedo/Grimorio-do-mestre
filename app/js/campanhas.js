// Escolha de campanhas, importação e backup
(function () {
  const { h } = G;

  G.mostrarCampanhas = async function () {
    if (G.estado.camp) { G.estado.fechar(); }
    G.renderizarBarra();
    document.body.classList.add('sem-campanha');
    const alvo = G.$('#conteudo');
    alvo.innerHTML = '';
    const lista = await G.arm.listar();

    const criar = async () => {
      const nome = await G.perguntar('Nome da campanha', '', 'ex.: A Queda de Ravenford');
      if (!nome) return;
      const id = await G.arm.criar(G.estado.campanhaVazia(nome));
      await abrir(id);
    };

    alvo.append(h('div', { class: 'tela-campanhas' },
      h('div', { class: 'selo-grande' }, '✦'),
      h('h1', null, 'Grimório do Mestre'),
      h('p', { class: 'sub' }, 'Escolha uma campanha'),
      h('div', { class: 'lista-campanhas' },
        lista.map(c => h('div', { class: 'campanha-item' },
          h('button', { class: 'campanha-abrir', onclick: () => abrir(c.id) },
            h('b', null, c.nome), h('small', null, `${c.total} páginas · ${G.tempoRelativo(c.editado)}`)),
          h('details', { class: 'menu' }, h('summary', { class: 'btn-icone' }, '⋯'),
            h('div', { class: 'menu-lista' },
              h('button', { onclick: async () => { const r = await G.arm.exportar(c.id); if (r) G.aviso('Campanha exportada'); } }, '⤒ Exportar backup'),
              G.arm.nativo ? h('button', { onclick: () => G.arm.abrirPasta(c.id) }, '📂 Abrir pasta') : null,
              h('button', { class: 'perigo', onclick: async () => { if (await G.confirmar(`Excluir a campanha "${c.nome}"? (no app instalado ela vai para a pasta "campanhas-excluidas")`, 'Excluir')) { await G.arm.excluir(c.id); G.mostrarCampanhas(); } } }, '🗑 Excluir'))))),
        !lista.length ? h('div', { class: 'vazio-pequeno' }, 'Nenhuma campanha ainda.') : null),
      h('div', { class: 'acoes-grandes' },
        h('button', { class: 'btn primario grande', onclick: criar }, '＋ Nova campanha'),
        h('button', {
          class: 'btn grande', onclick: async () => {
            const nome = 'Campanha importada do Notion';
            const id = await G.arm.criar(G.estado.campanhaVazia(nome));
            await abrir(id);
            G.janelaImportar(true);
          }
        }, '⤓ Nova a partir do Notion'),
        h('button', { class: 'btn grande', onclick: async () => { try { const id = await G.arm.importarBackup(); if (id) abrir(id); } catch (e) { G.aviso(e.message, 'erro'); } } }, '📂 Abrir backup (.grimorio)'))));
  };

  async function abrir(id) {
    try {
      await G.estado.abrir(id);
      document.body.classList.remove('sem-campanha');
      G.aplicarTema();
      if (G.rotaAtual() === 'painel') G.recarregarRota(); else G.ir('painel');
    } catch (e) { G.aviso('Não consegui abrir: ' + e.message, 'erro'); }
  }
  G.abrirCampanha = abrir;

  G.janelaImportar = function (direto) {
    const passos = h('ol', { class: 'passos' },
      h('li', null, 'No Notion, abra a página principal da campanha (ex.: “Campanha RPG Clássico”).'),
      h('li', null, 'Clique em ', h('b', null, '⋯'), ' (canto superior direito) → ', h('b', null, 'Exportar'), '.'),
      h('li', null, 'Formato: ', h('b', null, 'Markdown & CSV'), ' · Incluir conteúdo: ', h('b', null, 'Tudo'), ' · marque ', h('b', null, 'Incluir subpáginas'), ' e ', h('b', null, 'Criar pastas para subpáginas'), '.'),
      h('li', null, 'Salve o .zip e escolha-o no botão abaixo. Imagens, tags e links entre páginas vêm junto.'));
    const m = G.modal({
      titulo: direto ? 'Importar campanha do Notion' : 'Importar e exportar', largura: 640,
      corpo: h('div', null,
        h('h4', null, '⤓ Importar do Notion'),
        passos,
        h('p', { class: 'dica' }, 'Pode importar de novo depois: páginas que já existem são atualizadas, não duplicadas. Tags como “NPC”, “Monstro”, “Item” e “Mapas” definem o tipo; tags como “Escrituras” e “Corp Kafra” viram facções.'),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn primario', onclick: () => { m.fechar(); importarNotion(); } }, 'Escolher arquivo .zip do Notion…')),
        direto ? null : h('div', null,
          h('hr'),
          h('h4', null, '💾 Backup'),
          h('div', { class: 'linha-botoes' },
            h('button', { class: 'btn', onclick: async () => { const r = await G.arm.exportar(G.estado.camp.id); if (r) G.aviso('Backup salvo'); } }, '⤒ Exportar esta campanha (.grimorio)'),
            G.arm.nativo ? h('button', { class: 'btn', onclick: () => G.arm.abrirPasta(G.estado.camp.id) }, '📂 Abrir pasta dos dados') : null),
          h('p', { class: 'dica' }, 'O app também guarda sozinho uma cópia por dia (últimos 14 dias) na pasta “backups” da campanha.')))
    });
  };

  async function importarNotion() {
    const camp = G.estado.camp;
    let res;
    try {
      G.aviso('Lendo exportação do Notion…', 'info');
      res = await G.arm.importarNotion(camp.id);
    } catch (e) { return G.aviso('Falha na importação: ' + (e.message || e), 'erro', 6000); }
    if (!res) return;
    const { criadas, atualizadas } = G.estado.importarEntidades(res.entidades);
    if ((/^(Nova campanha|Campanha importada do Notion)$/.test(camp.nome)) && res.campanhaNome) { camp.nome = res.campanhaNome.trim(); G.estado.salvar(); }
    const r = res.relatorio;
    G.modal({
      titulo: 'Importação concluída', largura: 560,
      corpo: h('div', null,
        h('p', null, h('b', null, criadas), ' páginas novas, ', h('b', null, atualizadas), ' atualizadas, ', h('b', null, r.imagens), ' imagens.'),
        h('ul', null, Object.entries(r.porTipo).map(([t, n]) => h('li', null, `${G.TIPOS[t].icone} ${G.TIPOS[t].plural}: ${n}`))),
        r.ignoradas ? h('p', { class: 'dica' }, `${r.ignoradas} páginas que eram só índices (listas de subpáginas) foram puladas.`) : null,
        r.avisos.length ? h('details', null, h('summary', null, `${r.avisos.length} avisos`), h('ul', { class: 'dica' }, r.avisos.map(a => h('li', null, a)))) : null,
        h('p', { class: 'dica' }, 'Se alguma página caiu no tipo errado, abra-a e use ⋯ → Mudar tipo.')),
      acoes: [{ texto: 'Ver painel', primario: true, acao: f => { f(); G.ir('painel'); G.recarregarRota(); } }]
    });
  }
})();
