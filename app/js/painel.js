// Painel inicial da campanha
G.rota('painel', (alvo) => {
  const { h } = G;
  const camp = G.estado.camp;
  const todas = G.estado.lista();
  const sessoes = G.estado.lista('sessao').sort((a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0));
  const proxima = sessoes.filter(s => s.campos.status === 'Planejada').sort((a, b) => (+a.campos.numero || 0) - (+b.campos.numero || 0))[0];
  const ultima = sessoes.find(s => s.campos.status === 'Jogada');
  const missoesAtivas = G.estado.lista('missao').filter(m => m.campos.status === 'Ativa');
  const missoesDisp = G.estado.lista('missao').filter(m => m.campos.status === 'Disponível' || !m.campos.status);
  const pjs = G.estado.lista('jogador');
  const recentes = (camp.config.recentes || []).map(G.estado.obter).filter(Boolean).slice(0, 8);
  const editadas = todas.slice().sort((a, b) => b.editado - a.editado).filter(e => !recentes.includes(e)).slice(0, 8 - Math.min(recentes.length, 8) + 4);

  const nomeCamp = h('input', {
    class: 'titulo-campanha', value: camp.nome,
    onchange: (e) => { camp.nome = e.target.value.trim() || camp.nome; G.estado.salvar(); G.renderizarBarra(); }
  });

  const bloco = (titulo, conteudo, acao) => h('section', { class: 'bloco' },
    h('div', { class: 'bloco-cab' }, h('h2', null, titulo), acao || null), conteudo);

  if (!todas.length) {
    alvo.appendChild(h('div', { class: 'boas-vindas' },
      h('div', { class: 'selo-grande' }, '✦'),
      nomeCamp,
      h('p', null, 'Sua campanha está vazia. Comece trazendo o que você já tem no Notion, ou crie as primeiras páginas.'),
      h('div', { class: 'acoes-grandes' },
        h('button', { class: 'btn primario grande', onclick: () => G.janelaImportar() }, '⤓ Importar do Notion'),
        h('button', { class: 'btn grande', onclick: () => G.novaPagina('sessao') }, '📜 Criar a primeira sessão'),
        h('button', { class: 'btn grande', onclick: () => G.novaPagina('jogador') }, '🧙 Cadastrar personagens'))));
    return;
  }

  const contagem = G.ORDEM_TIPOS.map(t => ({ t, n: todas.filter(e => e.tipo === t).length })).filter(x => x.n);
  const segredos = sessoes.flatMap(s => G.md.tarefas(s.corpo).filter(t => !t.feita));

  alvo.append(
    h('div', { class: 'cab-painel' },
      h('div', null, nomeCamp, h('div', { class: 'sub-campanha' }, camp.sistema, ' · ', todas.length, ' páginas · editada ', G.tempoRelativo(camp.editado))),
      h('div', { class: 'acoes-cab' },
        h('button', { class: 'btn primario', onclick: () => G.ir('mesa') }, '🕯️ Abrir a mesa'),
        h('button', { class: 'btn', onclick: () => G.novaPagina('sessao') }, '＋ Sessão'))),
    h('div', { class: 'estatisticas' }, contagem.map(({ t, n }) =>
      h('a', { href: '#/lista/' + t, class: 'estat cor-' + G.TIPOS[t].cor }, h('b', null, n), h('span', null, G.TIPOS[t].icone + ' ' + G.TIPOS[t].plural)))),
    h('div', { class: 'grade-painel' },
      bloco('Próxima sessão', proxima
        ? h('div', null, G.cartaoEntidade(proxima, { compacto: true }),
          h('p', { class: 'resumo' }, G.resumoTexto(proxima.corpo, 220) || 'Sem anotações ainda.'),
          h('div', { class: 'linha-botoes' },
            h('button', { class: 'btn primario', onclick: () => { camp.mesa.sessaoId = proxima.id; G.estado.salvar(); G.ir('mesa'); } }, '▶ Mestrar esta sessão'),
            h('a', { class: 'btn', href: '#/pagina/' + proxima.id + '/editar' }, '✎ Preparar')))
        : h('div', { class: 'vazio-pequeno' }, 'Nenhuma sessão planejada. ', h('button', { class: 'link', onclick: () => G.novaPagina('sessao') }, 'Planejar a próxima')),
        ultima ? h('small', { class: 'dica' }, 'Última jogada: ', h('a', { href: '#/pagina/' + ultima.id }, ultima.titulo)) : null),
      bloco('Missões em andamento', missoesAtivas.length || missoesDisp.length
        ? h('div', { class: 'lista-simples' },
          missoesAtivas.map(m => G.cartaoEntidade(m, { compacto: true })),
          missoesDisp.length ? h('small', { class: 'dica' }, `${missoesDisp.length} disponíveis no quadro`) : null)
        : h('div', { class: 'vazio-pequeno' }, 'Nenhuma missão ativa.'),
        h('a', { href: '#/lista/missao', class: 'link' }, 'Quadro →')),
      bloco('O grupo', pjs.length
        ? h('div', { class: 'grupo' }, pjs.map(p => h('a', { href: '#/pagina/' + p.id, class: 'pj' },
          p.capa ? h('img', { src: G.estado.urlImagem(p.capa), alt: '' }) : h('span', { class: 'pj-icone' }, '🧙'),
          h('div', null, h('b', null, p.titulo), h('small', null, [p.campos.jogador, p.campos.classe].filter(Boolean).join(' · ')),
            h('div', { class: 'pj-stats' },
              p.campos.ca ? h('span', { title: 'Classe de Armadura' }, '🛡 ' + p.campos.ca) : null,
              p.campos.iniciativa !== undefined && p.campos.iniciativa !== '' ? h('span', { title: 'Iniciativa' }, '⚡ ' + G.dados.mod(p.campos.iniciativa)) : null,
              p.campos.percepcao ? h('span', { title: 'Percepção' }, '👁 ' + G.dados.mod(p.campos.percepcao)) : null)))))
        : h('div', { class: 'vazio-pequeno' }, 'Cadastre os personagens dos jogadores.', ' ', h('button', { class: 'link', onclick: () => G.novaPagina('jogador') }, 'Adicionar PJ'))),
      bloco('Segredos e pistas não revelados', segredos.length
        ? h('ul', { class: 'lista-segredos' }, segredos.slice(0, 8).map(s => h('li', { html: G.md.inline(s.texto, { resolverLink: G.estado.porTitulo }) })))
        : h('div', { class: 'vazio-pequeno' }, 'Use "- [ ]" nas sessões para listar segredos e pistas.'),
        segredos.length > 8 ? h('small', { class: 'dica' }, `+${segredos.length - 8} outros`) : null),
      bloco('Abertos recentemente', h('div', { class: 'grade-mini' }, (recentes.length ? recentes : editadas).slice(0, 8).map(e => G.cartaoEntidade(e, { compacto: true })))),
      bloco('Editados por último', h('div', { class: 'lista-editados' }, todas.slice().sort((a, b) => b.editado - a.editado).slice(0, 8).map(e =>
        h('a', { href: '#/pagina/' + e.id, class: 'editado-item' }, h('span', null, G.TIPOS[e.tipo].icone), h('span', { class: 'editado-titulo' }, e.titulo), h('small', null, G.tempoRelativo(e.editado))))))
    )
  );
  G.$$('a.wiki', alvo);
});
