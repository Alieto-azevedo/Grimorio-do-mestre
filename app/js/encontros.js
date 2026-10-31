// Montador e gerador de encontros (orçamento de XP do Pathfinder 1e)
(function () {
  const { h } = G;
  const DIFICULDADES = [['Fácil', -1], ['Média', 0], ['Desafiadora', 1], ['Difícil', 2], ['Épica', 3]];

  const est = () => {
    const c = G.estado.camp;
    if (!c.encontro) {
      const pjs = G.estado.lista('jogador');
      const niveis = pjs.map(p => +p.campos.nivel).filter(Boolean);
      c.encontro = { nivel: niveis.length ? Math.round(niveis.reduce((a, b) => a + b, 0) / niveis.length) : 1, tamanho: pjs.length || 4, dificuldade: 'Média', terreno: '', criaturas: [] };
    }
    return c.encontro;
  };

  function ndOrcamento(e, desloc) {
    let apl = +e.nivel || 1;
    if (e.tamanho >= 6) apl += 1;
    if (e.tamanho <= 3) apl -= 1;
    return apl + desloc;
  }
  function xpDeNdNumerico(n) {
    if (n >= 1) return G.XP_POR_ND[Math.min(20, Math.round(n))];
    if (n === 0) return G.XP_POR_ND['1/2'];
    if (n === -1) return G.XP_POR_ND['1/3'];
    return G.XP_POR_ND['1/4'];
  }
  function orcamento(e) {
    const d = DIFICULDADES.find(x => x[0] === e.dificuldade) || DIFICULDADES[1];
    return xpDeNdNumerico(ndOrcamento(e, d[1]));
  }
  function avaliar(e, total) {
    let rotulo = 'Trivial';
    for (const [nome, desloc] of DIFICULDADES) if (total >= xpDeNdNumerico(ndOrcamento(e, desloc)) * 0.9) rotulo = nome;
    if (total > xpDeNdNumerico(ndOrcamento(e, 3)) * 1.5) rotulo = 'Mortal';
    return rotulo;
  }
  const totalXP = (lista) => lista.reduce((s, c) => s + G.xpDoND(c.nd) * c.qtd, 0);

  G.encontroAdicionar = function (c, qtd = 1) {
    const e = est();
    const igual = e.criaturas.find(x => x.nome === c.nome && x.nd == c.nd);
    if (igual) igual.qtd += qtd; else e.criaturas.push(Object.assign({ qtd }, c));
    G.estado.salvar();
    G.aviso(`${qtd}× ${c.nome} no encontro`);
    G.emitir('encontro');
  };

  function candidatos(e) {
    const srd = G.BESTIARIO.filter(c => !e.terreno || c.terrenos.includes(e.terreno))
      .map(c => ({ nome: c.nome, nd: c.nd, ini: c.ini, pv: c.pv, ca: c.ca, srd: c.id }));
    const camp = G.estado.lista('criatura').filter(x => x.campos.nd && (!e.terreno || G.normalizar(x.campos.terreno).includes(G.normalizar(G.TERRENOS[e.terreno]))))
      .map(x => ({ nome: x.titulo, nd: x.campos.nd, ini: x.campos.iniciativa, pv: x.campos.pv, ca: x.campos.ca, entidadeId: x.id }));
    return [...camp, ...srd];
  }

  function gerar(e) {
    const alvo = orcamento(e);
    const cands = candidatos(e).filter(c => G.xpDoND(c.nd) <= alvo);
    if (!cands.length) return null;
    let melhor = null;
    for (let t = 0; t < 80; t++) {
      const principal = G.aleatorio(cands);
      const xp = G.xpDoND(principal.nd);
      const max = Math.min(8, Math.floor(alvo / xp));
      const n = 1 + Math.floor(Math.random() * max);
      const lista = [Object.assign({ qtd: n }, principal)];
      let resto = alvo - n * xp;
      const menores = cands.filter(c => c.nome !== principal.nome && G.xpDoND(c.nd) <= resto && G.xpDoND(c.nd) < xp);
      if (menores.length && Math.random() < 0.6) {
        const sec = G.aleatorio(menores);
        const m = Math.min(6, Math.floor(resto / G.xpDoND(sec.nd)));
        if (m > 0) { lista.push(Object.assign({ qtd: m }, sec)); resto -= m * G.xpDoND(sec.nd); }
      }
      const tot = totalXP(lista);
      const nota = Math.abs(1 - tot / alvo) + (lista.reduce((s, c) => s + c.qtd, 0) > 10 ? 0.5 : 0);
      if (!melhor || nota < melhor.nota) melhor = { lista, nota };
      if (nota < 0.05) break;
    }
    return melhor && melhor.lista;
  }

  G.rota('encontros', (alvo) => {
    const corpo = h('div');
    const desenhar = () => {
      const e = est();
      const total = totalXP(e.criaturas);
      const orc = orcamento(e);
      const pct = orc ? Math.min(150, Math.round(total / orc * 100)) : 0;
      const rotulo = e.criaturas.length ? avaliar(e, total) : '—';
      corpo.innerHTML = '';

      const campoNum = (rot, chave, min) => h('label', { class: 'rotulo' }, rot, h('input', { class: 'campo', type: 'number', min, value: e[chave], onchange: (ev) => { e[chave] = Math.max(min, +ev.target.value || min); G.estado.salvar(); desenhar(); } }));

      corpo.append(
        h('div', { class: 'cartao-ferramenta' },
          h('div', { class: 'linha-campos' },
            campoNum('Nível médio do grupo', 'nivel', 1),
            campoNum('Nº de personagens', 'tamanho', 1),
            h('label', { class: 'rotulo' }, 'Dificuldade', h('select', { class: 'campo', onchange: (ev) => { e.dificuldade = ev.target.value; G.estado.salvar(); desenhar(); } },
              DIFICULDADES.map(([d]) => h('option', { value: d, selected: d === e.dificuldade }, d)))),
            h('label', { class: 'rotulo' }, 'Terreno', h('select', { class: 'campo', onchange: (ev) => { e.terreno = ev.target.value; G.estado.salvar(); } },
              h('option', { value: '' }, 'Qualquer'), Object.entries(G.TERRENOS).map(([k, v]) => h('option', { value: k, selected: k === e.terreno }, v))))),
          h('div', { class: 'medidor' },
            h('div', { class: 'medidor-barra' }, h('div', { class: 'medidor-preench dif-' + G.normalizar(rotulo), style: { width: (pct / 1.5) + '%' } }), h('div', { class: 'medidor-marca', style: { left: (100 / 1.5) + '%' } })),
            h('div', { class: 'medidor-texto' }, h('b', null, `${total} XP`), ` de ${orc} XP (orçamento ${e.dificuldade.toLowerCase()}) · `, h('span', { class: 'selo-dif dif-' + G.normalizar(rotulo) }, rotulo),
              e.criaturas.length ? ` · ${Math.round(total / e.tamanho)} XP por personagem` : '')),
          h('div', { class: 'linha-botoes' },
            h('button', { class: 'btn primario', onclick: () => { const r = gerar(e); if (!r) return G.aviso('Nenhuma criatura cabe nesse orçamento/terreno.', 'erro'); e.criaturas = r; G.estado.salvar(); desenhar(); } }, '🎲 Gerar encontro aleatório'),
            h('button', { class: 'btn', onclick: () => G.janelaEscolherParaEncontro(desenhar) }, '＋ Adicionar criatura'),
            e.criaturas.length ? h('button', { class: 'btn', onclick: () => { e.criaturas = []; G.estado.salvar(); desenhar(); } }, 'Limpar') : null)),

        e.criaturas.length ? h('div', { class: 'cartao-ferramenta' },
          h('table', { class: 'tabela' },
            h('thead', null, h('tr', null, h('th', null, 'Qtd'), h('th', null, 'Criatura'), h('th', null, 'ND'), h('th', null, 'XP'), h('th', null, 'CA'), h('th', null, 'PV'), h('th', null, ''))),
            h('tbody', null, e.criaturas.map((c, i) => h('tr', null,
              h('td', null, h('input', { class: 'campo mini', type: 'number', min: 1, value: c.qtd, onchange: (ev) => { c.qtd = Math.max(1, +ev.target.value || 1); G.estado.salvar(); desenhar(); } })),
              h('td', { class: 'td-titulo' }, c.nome, c.srd ? h('button', { class: 'btn-icone', title: 'Ver ficha', onclick: () => G.verCriaturaSRD(c.srd) }, '📖') : null,
                c.entidadeId ? h('a', { class: 'btn-icone', href: '#/pagina/' + c.entidadeId }, '↗') : null),
              h('td', null, c.nd), h('td', null, G.xpDoND(c.nd) * c.qtd), h('td', null, c.ca || '—'), h('td', null, c.pv || '—'),
              h('td', null, h('button', { class: 'btn-icone', onclick: () => { e.criaturas.splice(i, 1); G.estado.salvar(); desenhar(); } }, '✕')))))),
          h('div', { class: 'linha-botoes' },
            h('button', {
              class: 'btn primario', onclick: () => {
                e.criaturas.forEach(c => G.adicionarCombatente({ nome: c.nome, modIni: c.ini, pv: c.pv, ca: c.ca, srd: c.srd, entidadeId: c.entidadeId }, c.qtd, { silencioso: true }));
                G.aviso('Encontro enviado à iniciativa');
                G.ir('iniciativa');
              }
            }, '⚔️ Enviar à iniciativa'),
            h('button', { class: 'btn', onclick: () => salvarEmPagina(e, total, rotulo) }, '💾 Anotar numa sessão/missão'))) : null,
        h('p', { class: 'dica' }, 'Orçamento pela tabela do Pathfinder 1e: ND do encontro = nível médio + ajuste da dificuldade (−1 a +3), com +1 para grupos de 6+ e −1 para grupos de 3 ou menos.')
      );
    };
    alvo.append(h('div', { class: 'cab-pagina' }, h('h1', null, h('span', { class: 'cab-icone' }, '🗺️'), 'Encontros')), corpo);
    desenhar();
    return G.on('encontro', desenhar);
  });

  G.janelaEscolherParaEncontro = function (aoMudar) {
    const busca = h('input', { class: 'campo', placeholder: 'Buscar criatura…' });
    const lista = h('div', { class: 'lista-escolha' });
    const e = est();
    const desenhar = () => {
      const q = G.normalizar(busca.value);
      lista.innerHTML = '';
      candidatos({ terreno: '' }).filter(c => !q || G.normalizar(c.nome).includes(q)).slice(0, 60).forEach(c =>
        lista.appendChild(h('button', { class: 'item-escolha', onclick: () => { G.encontroAdicionar(c, 1); aoMudar && aoMudar(); } },
          h('b', null, c.nome), h('small', null, `ND ${c.nd} · ${G.xpDoND(c.nd)} XP${c.entidadeId ? ' · campanha' : ''}`))));
    };
    busca.addEventListener('input', desenhar);
    G.modal({ titulo: 'Adicionar ao encontro', largura: 560, corpo: h('div', null, busca, lista), acoes: [{ texto: 'Pronto', primario: true, acao: f => f() }] });
    desenhar();
    void e;
  };

  function salvarEmPagina(e, total, rotulo) {
    const paginas = [...G.estado.lista('sessao'), ...G.estado.lista('missao')].sort((a, b) => b.editado - a.editado);
    if (!paginas.length) return G.aviso('Crie uma sessão ou missão primeiro.', 'erro');
    const sel = h('select', { class: 'campo' }, paginas.map(p => h('option', { value: p.id }, `${G.TIPOS[p.tipo].icone} ${p.titulo}`)));
    const nome = h('input', { class: 'campo', placeholder: 'Nome do encontro (opcional)' });
    G.modal({
      titulo: 'Anotar encontro', corpo: h('div', null, h('label', { class: 'rotulo' }, 'Página', sel), h('label', { class: 'rotulo' }, 'Nome', nome)),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Anotar', primario: true, acao: f => {
          const p = G.estado.obter(sel.value);
          const bloco = `\n### Encontro${nome.value.trim() ? ': ' + nome.value.trim() : ''} (${rotulo}, ${total} XP)\n` +
            e.criaturas.map(c => `- ${c.qtd}× ${c.entidadeId ? `[[${c.nome}]]` : c.nome} — ND ${c.nd}, CA ${c.ca || '?'}, PV ${c.pv || '?'}`).join('\n') + '\n';
          let corpo = p.corpo || '';
          const idx = corpo.search(/^## Encontros\s*$/m);
          if (idx >= 0) {
            const fimTitulo = corpo.indexOf('\n', idx) + 1;
            const prox = corpo.slice(fimTitulo).search(/^## /m);
            const pos = prox >= 0 ? fimTitulo + prox : corpo.length;
            corpo = corpo.slice(0, pos).replace(/\n*$/, '\n') + bloco + '\n' + corpo.slice(pos);
          } else corpo += '\n' + bloco;
          G.estado.atualizar(p.id, { corpo });
          G.aviso('Encontro anotado em ' + p.titulo);
          f();
        }
      }]
    });
  }
})();
