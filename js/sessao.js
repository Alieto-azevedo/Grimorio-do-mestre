// Área Sessão — Mesa: a sessão em andamento (segredos, cena, diário)
(function () {
  const { h } = G;
  const mesa = () => G.loja.meta.mesa;

  G.porEmCena = function (id) {
    const m = mesa();
    if (!m.emCena.includes(id)) m.emCena.unshift(id);
    G.loja.salvarMeta();
    G.emitir('mesa');
    G.aviso('Em cena na Mesa');
  };

  G.anotarNaSessao = function (texto, sessaoId) {
    const s = G.loja.obter(sessaoId || mesa().sessaoId);
    if (!s) return G.aviso('Escolha a sessão na Mesa primeiro', 'erro');
    const linha = `- **${G.horaAgora()}** — ${texto}`;
    let corpo = s.corpo || '';
    corpo = /^## Diário da mesa\s*$/m.test(corpo) ? corpo.replace(/\n*$/, '\n') + linha + '\n' : corpo.replace(/\n*$/, '\n\n') + '## Diário da mesa\n' + linha + '\n';
    G.loja.atualizar(s.id, { corpo }, { silencioso: true });
    G.emitir('mesa');
  };

  function diario(s) {
    const i = (s.corpo || '').search(/^## Diário da mesa\s*$/m);
    if (i < 0) return [];
    return s.corpo.slice(i).split('\n').slice(1).filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^-\s*/, ''));
  }

  function escolherSessao() {
    const m = mesa();
    const sessoes = G.loja.lista('sessao');
    if (!m.sessaoId || !G.loja.obter(m.sessaoId)) {
      const prox = sessoes.filter(s => s.campos.status === 'Planejada').sort((a, b) => (+a.campos.numero || 0) - (+b.campos.numero || 0))[0];
      m.sessaoId = (prox || sessoes.sort((a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0))[0] || {}).id || null;
    }
    return G.loja.obter(m.sessaoId);
  }

  G.rota('sessao', (alvo, sub = 'mesa') => {
    if (sub === 'combate') return G.telaCombate(alvo);
    if (sub === 'dados') return G.telaDados(alvo);
    if (sub === 'improviso') return G.telaImproviso(alvo);
    return telaMesa(alvo);
  });

  function telaMesa(alvo) {
    const corpo = h('div', { class: 'mesa' });
    const nota = h('input', { class: 'campo', placeholder: 'Anotar no diário da sessão…', enterkeyhint: 'send' });
    const enviar = () => { if (nota.value.trim()) { G.anotarNaSessao(nota.value.trim()); nota.value = ''; nota.focus(); } };
    nota.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });
    const barraNota = h('div', { class: 'barra-nota' }, nota, h('button', { class: 'btn primario', onclick: enviar, 'aria-label': 'Anotar' }, '➤'));

    const desenhar = () => {
      const m = mesa();
      const s = escolherSessao();
      const sessoes = G.loja.lista('sessao').sort((a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0));
      const ini = G.loja.meta.iniciativa;
      corpo.innerHTML = '';

      // Sessão atual
      corpo.append(h('section', { class: 'bloco' },
        h('div', { class: 'bloco-cab' },
          h('select', { class: 'campo sel-sessao', onchange: (ev) => { if (ev.target.value === '__nova') { const n = G.loja.criar('sessao'); m.sessaoId = n.id; } else m.sessaoId = ev.target.value; G.loja.salvarMeta(); desenhar(); } },
            sessoes.map(x => h('option', { value: x.id, selected: s && x.id === s.id }, x.titulo + (x.campos.status ? ` · ${x.campos.status}` : ''))),
            h('option', { value: '__nova' }, '＋ Nova sessão'))),
        s ? h('div', { class: 'linha-botoes' },
          h('a', { class: 'btn pequeno', href: '#/p/' + s.id + '/editar' }, '✎ Preparar'),
          s.campos.status !== 'Jogada'
            ? h('button', { class: 'btn pequeno', onclick: () => { G.loja.atualizar(s.id, { campos: Object.assign({}, s.campos, { status: 'Jogada', data: s.campos.data || new Date().toISOString().slice(0, 10) }) }); G.aviso('Sessão marcada como jogada'); desenhar(); } }, '✓ Marcar como jogada')
            : h('span', { class: 'selo ok' }, '✓ Jogada'))
          : h('p', { class: 'dica' }, 'Nenhuma sessão ainda. Escolha “＋ Nova sessão”.')));

      // Combate em andamento
      if (ini.iniciado && ini.participantes.length) {
        const vez = ini.participantes[ini.turno];
        corpo.append(h('a', { class: 'faixa-combate', href: '#/sessao/combate' }, '⚔️ Rodada ', h('b', null, ini.rodada), ' · vez de ', h('b', null, vez ? vez.nome : '—'), h('span', null, ' ›')));
      }

      if (s) {
        // Segredos e pistas
        const tarefas = G.md.tarefas(s.corpo);
        corpo.append(h('section', { class: 'bloco' },
          h('h2', null, '🔒 Segredos e pistas', tarefas.length ? h('span', { class: 'contador' }, `${tarefas.filter(t => t.feita).length}/${tarefas.length}`) : null),
          tarefas.length ? h('ul', { class: 'tarefas' }, tarefas.map(t => h('li', { class: t.feita ? 'feita' : '' },
            h('label', null, h('input', { type: 'checkbox', checked: t.feita, onchange: () => { G.loja.atualizar(s.id, { corpo: G.md.alternarTarefa(s.corpo, t.linha) }, { silencioso: true }); desenhar(); } }),
              h('span', { html: G.md.inline(t.texto, { resolverLink: G.loja.porTitulo }) })))))
            : h('p', { class: 'dica' }, 'Na preparação, escreva “- [ ] segredo” na sessão para aparecer aqui.')));
      }

      // Em cena
      m.emCena = m.emCena.filter(id => G.loja.obter(id));
      corpo.append(h('section', { class: 'bloco' },
        h('div', { class: 'bloco-cab' }, h('h2', null, '🎭 Em cena'),
          h('button', { class: 'btn pequeno', onclick: () => G.buscar({ titulo: 'Pôr em cena', permitirCriar: false, filtro: (e) => !m.emCena.includes(e.id), aoEscolher: (e) => G.porEmCena(e.id) }) }, '＋'),
          h('button', {
            class: 'btn pequeno', onclick: () => {
              const n = G.salvarNPCGerado(G.gerarNPC());
              m.emCena.unshift(n.id); G.loja.salvarMeta();
              if (s) G.anotarNaSessao(`Apareceu [[${n.titulo}]] (improvisado)`);
              desenhar(); G.verRapido(n.id);
            }
          }, '✨ NPC')),
        m.emCena.length ? h('div', { class: 'cena' }, m.emCena.map(id => {
          const e = G.loja.obter(id);
          const def = G.TIPOS[e.tipo];
          return h('div', { class: 'cena-item cor-' + def.cor },
            h('button', { class: 'cena-abrir', onclick: () => G.verRapido(id) },
              e.capa ? G.imgRef(e.capa, { class: 'cena-img' }) : h('span', { class: 'cena-img icone' }, def.icone),
              h('span', { class: 'cena-nome' }, e.titulo),
              h('small', null, def.nome + (e.ficha && e.ficha.ca ? ` · CA ${e.ficha.ca}` : ''))),
            def.ficha ? h('button', { class: 'cena-acao', title: 'Ao combate', onclick: () => G.enviarAoCombate(e) }, '⚔️') : null,
            h('button', { class: 'cena-acao', title: 'Tirar de cena', onclick: () => { m.emCena = m.emCena.filter(x => x !== id); G.loja.salvarMeta(); desenhar(); } }, '✕'));
        })) : h('p', { class: 'dica' }, 'Fixe aqui os NPCs, locais e criaturas da cena. Toque para ver a página sem sair da mesa.')));

      if (s) {
        // Roteiro
        corpo.append(h('details', { class: 'bloco roteiro' }, h('summary', null, h('h2', null, '📜 Roteiro da sessão')),
          G.conteudo(s.corpo.replace(/^## Diário da mesa[\s\S]*$/m, ''), { aoMudarTexto: (t) => { const resto = (s.corpo.match(/^## Diário da mesa[\s\S]*$/m) || [''])[0]; G.loja.atualizar(s.id, { corpo: t.replace(/\n*$/, '\n\n') + resto }, { silencioso: true }); } })));
        // Diário
        const d = diario(s);
        corpo.append(h('section', { class: 'bloco' }, h('h2', null, '🖋️ Diário da mesa'),
          d.length ? h('ul', { class: 'diario' }, d.slice().reverse().map(l => h('li', { html: G.md.inline(l, { resolverLink: G.loja.porTitulo }) }))) : h('p', { class: 'dica' }, 'Use o campo abaixo para anotar o que acontece. Fica salvo na página da sessão com horário.')));
      }
      G.hidratarImagens(corpo);
    };

    alvo.append(corpo, barraNota);
    desenhar();
    const offs = [G.on('mesa', desenhar), G.on('entidades', (d) => { if (d && d.remoto) desenhar(); }), G.on('meta', desenhar)];
    return () => offs.forEach(f => f());
  }
})();
