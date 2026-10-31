// Geradores de improviso e rolador de dados
(function () {
  const { h } = G;
  const T = () => G.TABELAS;
  const A = G.aleatorio;

  G.gerarNome = function (raca, genero) {
    const t = T().nomes[raca] || T().nomes.Humano;
    const g = genero || (Math.random() < 0.5 ? 'm' : 'f');
    return `${A(t[g])} ${A(t.sobrenomes)}`;
  };

  G.gerarNPC = function (racaEscolhida) {
    const raca = racaEscolhida || A(['Humano', 'Humano', 'Humano', 'Elfo', 'Anão', 'Halfling', 'Gnomo', 'Meio-orc']);
    const genero = Math.random() < 0.5 ? 'm' : 'f';
    return {
      nome: G.gerarNome(raca, genero), raca, genero,
      ocupacao: A(T().ocupacoes), aparencia: A(T().aparencias), personalidade: A(T().personalidades),
      motivacao: A(T().motivacoes), segredo: A(T().segredos), fala: A(T().falas)
    };
  };

  G.salvarNPCGerado = function (n) {
    const e = G.estado.criar('npc', {
      titulo: n.nome,
      campos: { raca: n.raca, ocupacao: n.ocupacao[0].toUpperCase() + n.ocupacao.slice(1), atitude: 'Neutro', estado: 'Vivo' },
      corpo: `## Aparência\n${n.aparencia[0].toUpperCase() + n.aparencia.slice(1)}.\n\n## Personalidade\n${n.personalidade[0].toUpperCase() + n.personalidade.slice(1)}.\n\n## Objetivos\nQuer ${n.motivacao}.\n\n## Segredos\n- [ ] ${n.segredo[0].toUpperCase() + n.segredo.slice(1)}.\n\n## Falas marcantes\n> ${n.fala}\n`
    });
    G.aviso(`NPC "${n.nome}" salvo`);
    return e;
  };

  function cartao(titulo, icone, gerar, opcoes = {}) {
    const saida = h('div', { class: 'gerador-saida' });
    const historico = [];
    const rodar = () => {
      const r = gerar();
      historico.unshift(r);
      saida.innerHTML = '';
      saida.append(
        typeof r === 'string' ? h('div', { class: 'gerado' }, r) : r.no,
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn pequeno', onclick: () => G.copiar(typeof r === 'string' ? r : r.texto) }, '📋 Copiar'),
          opcoes.salvar ? h('button', { class: 'btn pequeno', onclick: () => opcoes.salvar(r) }, opcoes.rotuloSalvar || '💾 Salvar') : null,
          G.estado.camp.mesa.sessaoId ? h('button', { class: 'btn pequeno', title: 'Anotar no diário da sessão em andamento', onclick: () => G.anotarNaSessao(`${titulo}: ${typeof r === 'string' ? r : r.texto}`) }, '🕯️ Anotar na sessão') : null),
        historico.length > 1 ? h('details', { class: 'hist-gerador' }, h('summary', null, 'Anteriores'),
          h('ul', null, historico.slice(1, 8).map(x => h('li', null, typeof x === 'string' ? x : x.texto)))) : null);
    };
    return h('section', { class: 'gerador' },
      h('div', { class: 'gerador-cab' }, h('h3', null, icone, ' ', titulo), opcoes.controles || null,
        h('button', { class: 'btn primario pequeno', onclick: rodar }, '🎲 Gerar')),
      saida);
  }

  G.rota('geradores', (alvo) => {
    const racaNome = h('select', { class: 'campo mini-sel' }, Object.keys(T().nomes).map(r => h('option', null, r)));
    const generoNome = h('select', { class: 'campo mini-sel' }, h('option', { value: '' }, 'Qualquer'), h('option', { value: 'm' }, 'Masc.'), h('option', { value: 'f' }, 'Fem.'));
    const racaNPC = h('select', { class: 'campo mini-sel' }, h('option', { value: '' }, 'Raça aleatória'), Object.keys(T().nomes).map(r => h('option', null, r)));

    alvo.append(
      h('div', { class: 'cab-pagina' }, h('h1', null, h('span', { class: 'cab-icone' }, '✨'), 'Geradores de improviso')),
      h('p', { class: 'dica' }, 'Para quando os jogadores perguntam o nome do guarda, o que tem para comer ou o que se ouve na taverna.'),
      h('div', { class: 'grade-geradores' },
        cartao('NPC rápido', '🎭', () => {
          const n = G.gerarNPC(racaNPC.value || null);
          const texto = `${n.nome} — ${n.raca}, ${n.ocupacao}. ${n.aparencia}; ${n.personalidade}. Quer ${n.motivacao}. Segredo: ${n.segredo}.`;
          return {
            texto, dados: n, no: h('div', { class: 'gerado npc-gerado' },
              h('b', { class: 'npc-nome' }, n.nome), h('div', null, `${n.raca} · ${n.ocupacao}`),
              h('ul', null, h('li', null, '👁 ', n.aparencia), h('li', null, '💬 ', n.personalidade), h('li', null, '🎯 Quer ', n.motivacao), h('li', null, '🔒 ', n.segredo), h('li', null, '🗨 ', n.fala)))
          };
        }, { controles: racaNPC, salvar: (r) => { const e = G.salvarNPCGerado(r.dados); G.ir('pagina/' + e.id); }, rotuloSalvar: '💾 Salvar como NPC' }),
        cartao('Nome', '📛', () => G.gerarNome(racaNome.value, generoNome.value), { controles: h('span', { class: 'controles' }, racaNome, generoNome) }),
        cartao('Taverna', '🍺', () => {
          const nome = `${A(T().tavernaA)} ${A(T().tavernaB)}`;
          const dono = G.gerarNPC();
          const prato = A(T().pratos);
          const texto = `Taverna "${nome}" — dono(a): ${dono.nome} (${dono.raca}, ${dono.personalidade}). Prato do dia: ${prato}.`;
          return { texto, no: h('div', { class: 'gerado' }, h('b', null, `"${nome}"`), h('div', null, `Dono(a): ${dono.nome}, ${dono.raca.toLowerCase()} — ${dono.personalidade}`), h('div', null, `🍲 Prato do dia: ${prato}`), h('div', null, `👂 Rumor: ${A(T().rumores)}`)) };
        }, {
          salvar: (r) => { const e = G.estado.criar('local', { titulo: r.texto.match(/"([^"]+)"/)[1], campos: { tipoLocal: 'Taverna' }, corpo: `## Descrição\n${r.texto}\n\n## Pontos de interesse\n- \n\n## NPCs importantes\n- \n\n## Rumores\n- \n` }); G.ir('pagina/' + e.id); },
          rotuloSalvar: '💾 Salvar como local'
        }),
        cartao('Rumor', '👂', () => A(T().rumores)),
        cartao('Gancho de aventura', '🪝', () => A(T().ganchos)),
        cartao('Complicação', '⚡', () => A(T().complicacoes)),
        cartao('Clima do dia', '🌦️', () => A(T().clima)),
        cartao('Bugiganga / tesouro curioso', '🗝️', () => A(T().bugigangas))
      ));
  });

  // ---------- Dados ----------
  G.rota('dados', (alvo) => {
    const expr = h('input', { class: 'campo grande', placeholder: 'ex.: 1d20+7, 2d6+3, 4d6kh3, 2d20kl1', value: '1d20' });
    const resultado = h('div', { class: 'resultado-dado' });
    const hist = h('ul', { class: 'hist-dados' });
    const qtd = h('input', { class: 'campo mini', type: 'number', min: 1, value: 1 });
    const mod = h('input', { class: 'campo mini', type: 'number', value: 0 });

    const mostrar = (r) => {
      resultado.innerHTML = `<div class="total ${r.critico || ''}">${r.total}</div><div class="detalhe">${G.esc(r.expr)} → ${G.dados.detalhe(r)}</div>${r.critico === 'max' ? '<div class="crit">20 natural!</div>' : r.critico === 'min' ? '<div class="crit falha">1 natural…</div>' : ''}`;
      resultado.classList.remove('pulso'); void resultado.offsetWidth; resultado.classList.add('pulso');
      desenharHist();
    };
    const rolar = (e) => { try { mostrar(G.dados.rolar(e)); } catch (err) { G.aviso(err.message, 'erro'); } };
    const desenharHist = () => {
      hist.innerHTML = '';
      G.dados.historico.slice(0, 20).forEach(r => hist.appendChild(h('li', null, h('b', { class: r.critico || '' }, r.total), ' ', h('span', null, r.expr), ' ', h('small', { html: G.dados.detalhe(r) }))));
    };
    const salvos = (G.estado.camp.config.macrosDados = G.estado.camp.config.macrosDados || ['1d20', '1d20+5', '2d6', '1d8+3', '4d6kh3', '2d20kh1', '2d20kl1']);
    const macros = h('div', { class: 'macros' });
    const desenharMacros = () => {
      macros.innerHTML = '';
      salvos.forEach((m, i) => macros.appendChild(h('span', { class: 'macro' },
        h('button', { class: 'chip', onclick: () => rolar(m) }, m),
        h('button', { class: 'macro-x', title: 'Remover', onclick: () => { salvos.splice(i, 1); G.estado.salvar(); desenharMacros(); } }, '×'))));
      macros.appendChild(h('button', { class: 'chip adicionar', onclick: () => { const v = expr.value.trim(); if (v && !salvos.includes(v)) { salvos.push(v); G.estado.salvar(); desenharMacros(); } } }, '+ salvar expressão atual'));
    };
    desenharMacros();

    alvo.append(
      h('div', { class: 'cab-pagina' }, h('h1', null, h('span', { class: 'cab-icone' }, '🎲'), 'Dados')),
      h('div', { class: 'grade-dados' },
        h('div', { class: 'cartao-ferramenta' },
          h('form', { class: 'linha-campos', onsubmit: (e) => { e.preventDefault(); rolar(expr.value); } }, expr, h('button', { class: 'btn primario' }, 'Rolar')),
          h('div', { class: 'linha-campos' }, h('label', { class: 'rotulo-inline' }, 'Qtd', qtd), h('label', { class: 'rotulo-inline' }, 'Mod', mod)),
          h('div', { class: 'botoes-dados' }, [4, 6, 8, 10, 12, 20, 100].map(f => h('button', {
            class: 'dado-btn', onclick: () => { const m = +mod.value || 0; rolar(`${+qtd.value || 1}d${f}${m ? (m > 0 ? '+' + m : m) : ''}`); }
          }, h('span', null, 'd' + f)))),
          h('h3', null, 'Atalhos'), macros,
          resultado),
        h('div', { class: 'cartao-ferramenta' }, h('h3', null, 'Histórico'), hist)));
    desenharHist();
    setTimeout(() => expr.focus(), 30);
  });
})();
