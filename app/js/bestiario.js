// Bestiário: referência rápida + criaturas da campanha
(function () {
  const { h } = G;
  const tamanhos = { Mi: 'Miúdo', P: 'Pequeno', M: 'Médio', G: 'Grande', E: 'Enorme' };

  G.statblockMd = (c) => [
    `**ND ${c.nd}** · ${c.xp} XP · ${c.tipo} ${tamanhos[c.tamanho] || c.tamanho}`,
    `**Iniciativa** ${G.dados.mod(c.ini)} · **Percepção** ${G.dados.mod(c.percepcao)}`,
    '',
    `**Defesa** CA ${c.ca} · PV ${c.pv} (${c.dv}) · Fort ${G.dados.mod(c.fort)}, Ref ${G.dados.mod(c.ref)}, Von ${G.dados.mod(c.von)}`,
    `**Ataque** ${c.ataques}`,
    `**Deslocamento** ${c.desloc}`,
    `**Especial** ${c.especial}`,
    '',
    `*Terreno: ${c.terrenos.map(t => G.TERRENOS[t]).join(', ')} · Original: ${c.original}*`
  ].join('\n');

  function blocoCriatura(c) {
    const qtd = h('input', { class: 'campo mini', type: 'number', min: 1, value: 1, title: 'Quantidade' });
    const corpo = h('div', { class: 'markdown statblock', html: G.renderMarkdown(G.statblockMd(c)) });
    G.dadosClicaveis(corpo);
    return h('div', { class: 'criatura' },
      h('div', { class: 'criatura-cab' },
        h('div', null, h('b', null, c.nome), h('small', null, ` ${c.original !== c.nome ? '(' + c.original + ')' : ''}`)),
        h('span', { class: 'selo-nd' }, 'ND ' + c.nd)),
      corpo,
      h('div', { class: 'linha-botoes' },
        qtd,
        h('button', { class: 'btn pequeno primario', onclick: () => G.adicionarCombatente({ nome: c.nome, modIni: c.ini, pv: c.pv, ca: c.ca, srd: c.id }, +qtd.value || 1) }, '⚔️ Ao combate'),
        h('button', { class: 'btn pequeno', onclick: () => { G.encontroAdicionar({ nome: c.nome, nd: c.nd, ini: c.ini, pv: c.pv, ca: c.ca, srd: c.id }, +qtd.value || 1); } }, '🗺️ No encontro'),
        h('button', {
          class: 'btn pequeno', title: 'Cria uma página de criatura na campanha para você personalizar', onclick: () => {
            const e = G.estado.criar('criatura', {
              titulo: c.nome, corpo: '## Bloco de estatísticas\n' + G.statblockMd(c) + '\n\n## Táticas\n\n\n## Tesouro\n- \n',
              campos: { nd: c.nd, ca: c.ca, pv: c.pv, iniciativa: c.ini, percepcao: c.percepcao, tipoCriatura: c.tipo, terreno: c.terrenos.map(t => G.TERRENOS[t]).join(', ') }
            });
            G.ir('pagina/' + e.id);
          }
        }, '📄 Copiar p/ campanha')));
  }

  G.verCriaturaSRD = (id) => {
    const c = G.BESTIARIO.find(x => x.id === id);
    if (c) G.modal({ titulo: c.nome, corpo: blocoCriatura(c), largura: 620 });
  };

  G.rota('bestiario', (alvo) => {
    let q = '', terreno = '', ndMin = 0, ndMax = 30;
    const resultado = h('div', { class: 'grade-criaturas' });
    const campanha = h('div');
    const desenhar = () => {
      const lista = G.BESTIARIO.filter(c =>
        (!q || G.normalizar(c.nome + ' ' + c.original + ' ' + c.tipo).includes(q)) &&
        (!terreno || c.terrenos.includes(terreno)) &&
        G.ndNumero(c.nd) >= ndMin && G.ndNumero(c.nd) <= ndMax
      ).sort((a, b) => G.ndNumero(a.nd) - G.ndNumero(b.nd) || a.nome.localeCompare(b.nome));
      resultado.innerHTML = '';
      lista.forEach(c => resultado.appendChild(blocoCriatura(c)));
      if (!lista.length) resultado.appendChild(h('div', { class: 'vazio-pequeno' }, 'Nenhuma criatura com esses filtros.'));

      const daCamp = G.estado.lista('criatura').filter(e => !q || G.normalizar(e.titulo).includes(q))
        .filter(e => G.ndNumero(e.campos.nd) >= ndMin && G.ndNumero(e.campos.nd) <= ndMax)
        .sort((a, b) => G.ndNumero(a.campos.nd) - G.ndNumero(b.campos.nd));
      campanha.innerHTML = '';
      if (daCamp.length) {
        campanha.append(h('h2', { class: 'secao-titulo' }, '🐉 Criaturas da sua campanha ', h('span', { class: 'contador' }, daCamp.length)),
          h('div', { class: 'grade-mini' }, daCamp.map(e => h('div', { class: 'mini-criatura' },
            G.cartaoEntidade(e, { compacto: true }),
            h('button', { class: 'btn-icone', title: 'Ao combate', onclick: () => G.enviarAoCombate(e) }, '⚔️'),
            h('button', { class: 'btn-icone', title: 'No encontro', onclick: () => G.encontroAdicionar({ nome: e.titulo, nd: e.campos.nd, ini: e.campos.iniciativa, pv: e.campos.pv, ca: e.campos.ca, entidadeId: e.id }, 1) }, '🗺️')))));
      }
    };
    alvo.append(
      h('div', { class: 'cab-pagina' }, h('h1', null, h('span', { class: 'cab-icone' }, '🐉'), 'Bestiário'),
        h('button', { class: 'btn', onclick: () => G.novaPagina('criatura') }, '＋ Criatura própria')),
      h('div', { class: 'barra-filtros' },
        h('input', { class: 'campo', placeholder: 'Buscar por nome, tipo…', oninput: (e) => { q = G.normalizar(e.target.value); desenhar(); } }),
        h('select', { class: 'campo', onchange: (e) => { terreno = e.target.value; desenhar(); } },
          h('option', { value: '' }, 'Todos os terrenos'), Object.entries(G.TERRENOS).map(([k, v]) => h('option', { value: k }, v))),
        h('label', { class: 'rotulo-inline' }, 'ND de', h('input', { class: 'campo mini', type: 'number', min: 0, step: 1, value: 0, oninput: (e) => { ndMin = +e.target.value || 0; desenhar(); } })),
        h('label', { class: 'rotulo-inline' }, 'até', h('input', { class: 'campo mini', type: 'number', min: 0, step: 1, value: 30, oninput: (e) => { ndMax = e.target.value === '' ? 30 : +e.target.value; desenhar(); } }))),
      campanha,
      h('h2', { class: 'secao-titulo' }, '📚 Referência (Pathfinder 1e)'),
      h('p', { class: 'dica' }, 'Resumo para consulta em mesa. Valores clicáveis rolam dados. Use "Copiar p/ campanha" para criar sua versão editável.'),
      resultado);
    desenhar();
    return G.on('entidades', desenhar);
  });
})();
