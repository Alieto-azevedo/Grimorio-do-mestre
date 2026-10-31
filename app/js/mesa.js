// Mesa ao vivo: tudo o que o mestre precisa durante a sessão numa tela só
(function () {
  const { h } = G;
  const mesa = () => G.estado.camp.mesa;

  G.porEmCena = function (id) {
    const m = mesa();
    if (!m.emCena.includes(id)) m.emCena.unshift(id);
    G.estado.salvar();
    G.emitir('mesa');
    G.aviso('Fixado na Mesa ao vivo');
  };

  G.anotarNaSessao = function (texto, sessaoId) {
    const id = sessaoId || mesa().sessaoId;
    const s = G.estado.obter(id);
    if (!s) return G.aviso('Escolha a sessão na Mesa ao vivo primeiro.', 'erro');
    const linha = `- **${G.horaAgora()}** — ${texto}`;
    let corpo = s.corpo || '';
    if (/^## Diário da mesa\s*$/m.test(corpo)) corpo = corpo.replace(/\n*$/, '\n') + linha + '\n';
    else corpo = corpo.replace(/\n*$/, '\n\n') + '## Diário da mesa\n' + linha + '\n';
    G.estado.atualizar(id, { corpo }, { silencioso: true });
    G.emitir('mesa');
  };

  function diario(s) {
    const corpo = s.corpo || '';
    const i = corpo.search(/^## Diário da mesa\s*$/m);
    if (i < 0) return [];
    return corpo.slice(i).split('\n').slice(1).filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^-\s*/, ''));
  }

  G.rota('mesa', (alvo) => {
    const colSessao = h('section', { class: 'mesa-col' });
    const colCena = h('section', { class: 'mesa-col mesa-cena' });
    const colCombate = h('section', { class: 'mesa-col' });

    function desenharSessao() {
      const m = mesa();
      const sessoes = G.estado.lista('sessao').sort((a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0));
      if (!m.sessaoId || !G.estado.obter(m.sessaoId)) {
        const prox = sessoes.filter(s => s.campos.status === 'Planejada').sort((a, b) => (+a.campos.numero || 0) - (+b.campos.numero || 0))[0];
        m.sessaoId = (prox || sessoes[0] || {}).id || null;
      }
      const s = G.estado.obter(m.sessaoId);
      colSessao.innerHTML = '';
      colSessao.append(h('div', { class: 'mesa-cab' }, h('h2', null, '📜 Sessão'),
        h('select', { class: 'campo', onchange: (ev) => { m.sessaoId = ev.target.value; G.estado.salvar(); desenharSessao(); } },
          sessoes.map(x => h('option', { value: x.id, selected: x.id === m.sessaoId }, x.titulo + (x.campos.status ? ` (${x.campos.status})` : ''))),
          h('option', { value: '' }, '—')),
        h('button', { class: 'btn-icone', title: 'Nova sessão', onclick: () => { const n = G.estado.criar('sessao'); m.sessaoId = n.id; G.estado.salvar(); desenharSessao(); } }, '＋')));
      if (!s) { colSessao.appendChild(h('div', { class: 'vazio-pequeno' }, 'Crie uma sessão para começar a anotar.')); return; }

      const tarefas = G.md.tarefas(s.corpo);
      const nota = h('input', { class: 'campo', placeholder: 'O que aconteceu? (Enter para anotar)' });
      nota.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && nota.value.trim()) { G.anotarNaSessao(nota.value.trim(), s.id); nota.value = ''; setTimeout(() => G.$('.mesa-col input.campo[placeholder^="O que"]').focus(), 10); } });

      colSessao.append(
        h('div', { class: 'linha-botoes' },
          h('a', { class: 'btn pequeno', href: '#/pagina/' + s.id }, '↗ Abrir página'),
          s.campos.status !== 'Jogada' ? h('button', {
            class: 'btn pequeno', onclick: () => {
              G.estado.atualizar(s.id, { campos: Object.assign({}, s.campos, { status: 'Jogada', data: s.campos.data || new Date().toISOString().slice(0, 10) }) });
              G.aviso('Sessão marcada como jogada'); desenharSessao();
            }
          }, '✓ Marcar como jogada') : h('span', { class: 'selo' }, '✓ Jogada')),
        h('h3', null, 'Segredos e pistas'),
        tarefas.length ? h('ul', { class: 'lista-tarefas' }, tarefas.map(t => h('li', { class: t.feita ? 'feita' : '' },
          h('label', null, h('input', {
            type: 'checkbox', checked: t.feita, onchange: () => {
              G.estado.atualizar(s.id, { corpo: G.md.alternarTarefa(s.corpo, t.linha) }, { silencioso: true });
              desenharSessao();
            }
          }), h('span', { html: G.md.inline(t.texto, { resolverLink: G.estado.porTitulo }) })))))
          : h('div', { class: 'vazio-pequeno' }, 'Escreva "- [ ] segredo" na página da sessão para aparecer aqui.'),
        h('h3', null, 'Diário da mesa'),
        nota,
        h('ul', { class: 'diario' }, diario(s).slice(-12).reverse().map(l => h('li', { html: G.md.inline(l, { resolverLink: G.estado.porTitulo }) }))));
    }

    function desenharCena() {
      const m = mesa();
      m.emCena = m.emCena.filter(id => G.estado.obter(id));
      const busca = h('input', { class: 'campo', placeholder: '＋ Pôr em cena: NPC, local, criatura…' });
      const sugestoes = h('div', { class: 'sugestoes' });
      busca.addEventListener('input', () => {
        const q = G.normalizar(busca.value);
        sugestoes.innerHTML = '';
        if (!q) return;
        G.estado.lista().filter(e => G.normalizar(e.titulo).includes(q) && !m.emCena.includes(e.id)).slice(0, 6).forEach(e =>
          sugestoes.appendChild(h('button', { class: 'item-escolha', onclick: () => { m.emCena.unshift(e.id); G.estado.salvar(); desenharCena(); } }, G.TIPOS[e.tipo].icone + ' ' + e.titulo)));
      });
      colCena.innerHTML = '';
      colCena.append(
        h('div', { class: 'mesa-cab' }, h('h2', null, '🎭 Em cena'),
          h('button', {
            class: 'btn pequeno', title: 'Gera um NPC improvisado e põe em cena', onclick: () => {
              const n = G.salvarNPCGerado(G.gerarNPC());
              m.emCena.unshift(n.id); G.estado.salvar(); desenharCena();
              if (m.sessaoId) G.anotarNaSessao(`Apareceu [[${n.titulo}]] (NPC improvisado)`);
            }
          }, '✨ NPC improvisado'),
          m.emCena.length ? h('button', { class: 'btn pequeno', onclick: () => { m.emCena = []; G.estado.salvar(); desenharCena(); } }, 'Limpar cena') : null),
        busca, sugestoes);
      if (!m.emCena.length) colCena.appendChild(h('div', { class: 'vazio-pequeno' }, 'Fixe aqui os NPCs, locais e criaturas da cena atual para consultar sem trocar de tela. Também dá para usar o botão “🕯️ Em cena” em qualquer página.'));
      m.emCena.forEach(id => {
        const e = G.estado.obter(id);
        const def = G.TIPOS[e.tipo];
        const corpo = h('div', { class: 'markdown cena-texto', html: G.renderMarkdown(e.corpo) });
        G.dadosClicaveis(corpo);
        const props = def.campos.filter(c => e.campos[c.id]).map(c => {
          let v = e.campos[c.id];
          if (c.tipo === 'ref') { const r = G.estado.obter(v); v = r ? r.titulo : ''; }
          return v ? h('span', { class: 'cena-prop' }, h('small', null, c.nome), ' ', String(v)) : null;
        });
        const cartao = h('article', { class: 'cena-cartao cor-' + def.cor },
          h('div', { class: 'cena-cab' },
            e.capa ? h('img', { class: 'cena-img', src: G.estado.urlImagem(e.capa), alt: '' }) : h('span', { class: 'cena-icone' }, def.icone),
            h('div', { class: 'cena-titulo' }, h('a', { href: '#/pagina/' + e.id }, e.titulo), h('small', null, def.nome + (def.subtitulo(e) ? ' · ' + def.subtitulo(e) : ''))),
            ['npc', 'criatura', 'jogador'].includes(e.tipo) ? h('button', { class: 'btn-icone', title: 'Ao combate', onclick: () => G.enviarAoCombate(e) }, '⚔️') : null,
            h('button', { class: 'btn-icone', title: 'Expandir/recolher', onclick: () => cartao.classList.toggle('aberto') }, '↕'),
            h('button', { class: 'btn-icone', title: 'Tirar de cena', onclick: () => { m.emCena = m.emCena.filter(x => x !== id); G.estado.salvar(); desenharCena(); } }, '✕')),
          props.length ? h('div', { class: 'cena-props' }, props) : null,
          corpo);
        colCena.appendChild(cartao);
      });
    }

    function desenharCombate() {
      colCombate.innerHTML = '';
      const expr = h('input', { class: 'campo', placeholder: '1d20+5', value: '1d20' });
      const res = h('div', { class: 'mini-resultados' });
      const ult = () => { res.innerHTML = ''; G.dados.historico.slice(0, 5).forEach(r => res.appendChild(h('div', null, h('b', { class: r.critico || '' }, r.total), ' ', h('small', null, r.expr)))); };
      colCombate.append(
        h('div', { class: 'mesa-cab' }, h('h2', null, '⚔️ Combate'), h('a', { class: 'btn pequeno', href: '#/iniciativa' }, 'Tela cheia ↗')),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn pequeno', onclick: G.adicionarGrupo }, '🧙 + Grupo'),
          h('button', { class: 'btn pequeno', onclick: G.janelaEscolherCriatura }, '🐉 + Criatura')),
        G.painelIniciativa({ completo: false }),
        h('h3', null, '🎲 Dados'),
        h('form', { class: 'linha-campos', onsubmit: (ev) => { ev.preventDefault(); try { G.dados.rolar(expr.value); ult(); } catch (er) { G.aviso(er.message, 'erro'); } } }, expr, h('button', { class: 'btn' }, 'Rolar')),
        h('div', { class: 'botoes-dados pequenos' }, ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '1d100'].map(d => h('button', { class: 'dado-btn', onclick: () => { G.dados.rolar(d); ult(); } }, d.slice(1)))),
        res,
        h('h3', null, '✨ Improviso'),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn pequeno', onclick: () => G.aviso('📛 ' + G.gerarNome('Humano'), 'info', 6000) }, 'Nome'),
          h('button', { class: 'btn pequeno', onclick: () => G.aviso('👂 ' + G.aleatorio(G.TABELAS.rumores), 'info', 8000) }, 'Rumor'),
          h('button', { class: 'btn pequeno', onclick: () => G.aviso('🌦️ ' + G.aleatorio(G.TABELAS.clima), 'info', 6000) }, 'Clima'),
          h('button', { class: 'btn pequeno', onclick: () => G.aviso('⚡ ' + G.aleatorio(G.TABELAS.complicacoes), 'info', 8000) }, 'Complicação')));
      ult();
    }

    alvo.append(
      h('div', { class: 'cab-pagina' }, h('h1', null, h('span', { class: 'cab-icone' }, '🕯️'), 'Mesa ao vivo')),
      h('div', { class: 'mesa' }, colSessao, colCena, colCombate));
    desenharSessao(); desenharCena(); desenharCombate();
    const offs = [
      G.on('mesa', () => { desenharSessao(); desenharCena(); }),
      G.on('iniciativa', desenharCombate)
    ];
    return () => offs.forEach(f => f());
  });
})();
