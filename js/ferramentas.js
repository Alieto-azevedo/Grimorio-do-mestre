// Área Sessão — Dados e Improviso
(function () {
  const { h } = G;
  const T = () => G.TABELAS;
  const A = G.aleatorio;

  G.gerarNome = (raca, genero) => {
    const t = T().nomes[raca] || T().nomes.Humano;
    return `${A(t[genero || (Math.random() < 0.5 ? 'm' : 'f')])} ${A(t.sobrenomes)}`;
  };
  G.gerarNPC = (raca) => {
    raca = raca || A(['Humano', 'Humano', 'Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-orc']);
    return { nome: G.gerarNome(raca), raca, ocupacao: A(T().ocupacoes), aparencia: A(T().aparencias), personalidade: A(T().personalidades), motivacao: A(T().motivacoes), segredo: A(T().segredos), fala: A(T().falas) };
  };
  G.salvarNPCGerado = (n) => G.loja.criar('npc', {
    titulo: n.nome, tags: ['improvisado'],
    campos: { raca: n.raca, ocupacao: G.maiuscula(n.ocupacao), atitude: 'Neutro', estado: 'Vivo' },
    corpo: `## Aparência\n${G.maiuscula(n.aparencia)}.\n\n## Personalidade\n${G.maiuscula(n.personalidade)}.\n\n## Objetivos\nQuer ${n.motivacao}.\n\n## Segredos\n- [ ] ${G.maiuscula(n.segredo)}.\n\n## Falas\n> ${n.fala}\n`
  });

  // ---------- Dados ----------
  G.telaDados = function (alvo) {
    const m = G.loja.meta;
    const expr = h('input', { class: 'campo expr', placeholder: '1d20+5', value: '1d20', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    let qtd = 1, mod = 0;
    const hist = h('ul', { class: 'hist' });
    const rolar = (e, rot) => { try { G.mostrarRolagem(G.dados.rolar(e), rot); desenharHist(); } catch (err) { G.aviso(err.message, 'erro'); } };
    const desenharHist = () => { hist.innerHTML = ''; G.dados.historico.slice(0, 15).forEach(r => hist.appendChild(h('li', null, h('b', { class: r.critico || '' }, r.total), ' ', r.expr, ' ', h('small', { html: G.dados.detalhe(r) })))); };
    const contador = (rot, get, set) => h('div', { class: 'contador-dado' }, h('small', null, rot),
      h('button', { class: 'btn redondo', onclick: (ev) => { set(get() - 1); ev.target.nextSibling.textContent = rotulo(rot, get()); } }, '−'),
      h('b', null, rotulo(rot, get())),
      h('button', { class: 'btn redondo', onclick: (ev) => { set(get() + 1); ev.target.previousSibling.textContent = rotulo(rot, get()); } }, '+'));
    const rotulo = (rot, v) => rot === 'Qtd' ? v : (v >= 0 ? '+' + v : String(v));
    const macros = h('div', { class: 'chips' });
    const desenharMacros = () => {
      macros.innerHTML = '';
      m.config.macros.forEach((x, i) => macros.appendChild(h('button', {
        class: 'chip grande', onclick: () => rolar(x, x),
        oncontextmenu: (ev) => { ev.preventDefault(); m.config.macros.splice(i, 1); G.loja.salvarMeta(); desenharMacros(); }
      }, x)));
      macros.appendChild(h('button', { class: 'chip adicionar', onclick: () => { const v = expr.value.trim(); if (v && !m.config.macros.includes(v)) { m.config.macros.push(v); G.loja.salvarMeta(); desenharMacros(); } } }, '+ salvar'));
    };
    desenharMacros();
    alvo.append(h('div', { class: 'dados-tela' },
      h('div', { class: 'grade-dados' }, [4, 6, 8, 10, 12, 20, 100].map(f => h('button', { class: 'dado d' + f, onclick: () => rolar(`${qtd}d${f}${mod ? (mod > 0 ? '+' + mod : mod) : ''}`) }, h('span', null, 'd' + f)))),
      h('div', { class: 'linha-contadores' }, contador('Qtd', () => qtd, (v) => { qtd = G.limitar(v, 1, 20); }), contador('Mod', () => mod, (v) => { mod = G.limitar(v, -20, 40); })),
      h('form', { class: 'linha-expr', onsubmit: (e) => { e.preventDefault(); rolar(expr.value, expr.value); } }, expr, h('button', { class: 'btn primario' }, 'Rolar')),
      h('h3', null, 'Atalhos ', h('small', { class: 'dica' }, '(segure para apagar)')), macros,
      h('h3', null, 'Histórico'), hist));
    desenharHist();
  };

  // ---------- Improviso ----------
  G.telaImproviso = function (alvo) {
    const racas = Object.keys(T().nomes);
    const saida = h('div', { class: 'saida-improviso' });
    const mostrar = (titulo, texto, acoes = []) => {
      saida.innerHTML = '';
      saida.append(h('div', { class: 'gerado' }, h('small', null, titulo), typeof texto === 'string' ? h('p', null, texto) : texto),
        h('div', { class: 'linha-botoes' },
          ...acoes,
          G.loja.meta.mesa.sessaoId ? h('button', { class: 'btn pequeno', onclick: () => { G.anotarNaSessao(`${titulo}: ${typeof texto === 'string' ? texto : texto.textContent}`); G.aviso('Anotado no diário'); } }, '🖋️ Anotar') : null));
      saida.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const raca = h('select', { class: 'campo' }, h('option', { value: '' }, 'Raça aleatória'), racas.map(r => h('option', null, r)));
    const botao = (ic, rot, fn) => h('button', { class: 'gerador', onclick: fn }, h('span', null, ic), rot);
    alvo.append(h('div', { class: 'improviso' },
      h('div', { class: 'linha-campos' }, raca),
      h('div', { class: 'grade-geradores' },
        botao('🎭', 'NPC', () => {
          const n = G.gerarNPC(raca.value || null);
          mostrar('NPC', h('div', { class: 'npc' }, h('b', null, n.nome), h('div', null, `${n.raca} · ${n.ocupacao}`),
            h('ul', null, h('li', null, '👁 ' + n.aparencia), h('li', null, '💬 ' + n.personalidade), h('li', null, '🎯 Quer ' + n.motivacao), h('li', null, '🔒 ' + n.segredo), h('li', null, '🗨 ' + n.fala))),
          [h('button', { class: 'btn pequeno primario', onclick: () => { const e = G.salvarNPCGerado(n); G.porEmCena(e.id); } }, '💾 Salvar e pôr em cena')]);
        }),
        botao('📛', 'Nome', () => mostrar('Nome', G.gerarNome(raca.value || 'Humano'))),
        botao('🍺', 'Taverna', () => { const d = G.gerarNPC(); mostrar('Taverna', `"${A(T().tavernaA)} ${A(T().tavernaB)}" — dono(a) ${d.nome} (${d.raca.toLowerCase()}, ${d.personalidade}). Prato do dia: ${A(T().pratos)}.`); }),
        botao('👂', 'Rumor', () => mostrar('Rumor', A(T().rumores))),
        botao('🪝', 'Gancho', () => mostrar('Gancho', A(T().ganchos))),
        botao('⚡', 'Complicação', () => mostrar('Complicação', A(T().complicacoes))),
        botao('🌦️', 'Clima', () => mostrar('Clima', A(T().clima))),
        botao('🗝️', 'Bugiganga', () => mostrar('Bugiganga', A(T().bugigangas)))),
      saida));
  };
})();
