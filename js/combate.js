// Área Sessão — Combate (iniciativa) pensado para toque
(function () {
  const { h } = G;
  const CONDICOES = ['Abalado', 'Agarrado', 'Amedrontado', 'Apavorado', 'Atordoado', 'Caído', 'Cego', 'Confuso', 'Desprevenido', 'Enjoado',
    'Enredado', 'Exausto', 'Fascinado', 'Fatigado', 'Imobilizado', 'Inconsciente', 'Invisível', 'Nauseado', 'Ofuscado', 'Paralisado',
    'Pasmo', 'Sangrando', 'Surdo', 'Abençoado', 'Acelerado', 'Lento'];
  const TIPOS_P = { pj: 'PJ', npc: 'NPC', monstro: 'Monstro' };
  const est = () => G.loja.meta.iniciativa;
  const salvar = () => { G.loja.salvarMeta(); G.emitir('iniciativa'); };
  const log = (t) => { const s = est(); s.log = s.log || []; s.log.unshift({ t: G.horaAgora(), r: s.rodada, texto: t }); s.log.splice(40); };
  let aberto = null; // participante expandido

  function ordenar() {
    const s = est();
    const ativo = s.participantes[s.turno] && s.participantes[s.turno].id;
    const o = { pj: 0, npc: 1, monstro: 2 };
    s.participantes.sort((a, b) => ((b.ini ?? -99) - (a.ini ?? -99)) || ((+b.desempate || 0) - (+a.desempate || 0)) || (o[a.tipo] - o[b.tipo]) || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    if (ativo) s.turno = Math.max(0, s.participantes.findIndex(p => p.id === ativo));
  }

  G.adicionarCombatente = function (d, qtd = 1, { rolar = true, silencioso = false } = {}) {
    const s = est();
    const usados = new Set(s.participantes.map(p => p.nome));
    const novos = [];
    for (let i = 0; i < qtd; i++) {
      let nome = d.nome;
      if (qtd > 1 || usados.has(nome)) { let n = qtd > 1 ? 1 : 2; const base = d.nome.replace(/\s+\d+$/, ''); while (usados.has(`${base} ${n}`)) n++; nome = `${base} ${n}`; }
      usados.add(nome);
      const mod = parseInt(d.modIni, 10) || 0;
      const tipo = d.tipo || 'monstro';
      const p = {
        id: G.uid(), nome, tipo,
        ini: d.ini !== undefined && d.ini !== '' && d.ini !== null ? +d.ini : (rolar && tipo !== 'pj' ? G.dados.d(20) + mod : null),
        desempate: mod, pvMax: +d.pv || 0, pv: +d.pv || 0, pvTemp: 0, ca: d.ca || '', condicoes: [], entidadeId: d.entidadeId || null
      };
      s.participantes.push(p); novos.push(p);
    }
    ordenar();
    log('Entrou: ' + novos.map(p => p.nome).join(', '));
    salvar();
    if (!silencioso) G.aviso(`${qtd > 1 ? qtd + '× ' : ''}${d.nome} no combate`);
    return novos;
  };

  G.enviarAoCombate = function (e) {
    const f = e.ficha || {};
    const dados = { nome: e.titulo, tipo: e.tipo === 'jogador' ? 'pj' : e.tipo === 'npc' ? 'npc' : 'monstro', modIni: f.ini, pv: f.pv, ca: f.ca, entidadeId: e.id };
    if (e.tipo === 'jogador') return G.adicionarCombatente(dados, 1, { rolar: false });
    const qtd = h('input', { class: 'campo grande-num', type: 'number', inputmode: 'numeric', min: 1, value: 1 });
    G.folha({
      titulo: `${e.titulo} ao combate`, corpo: h('label', { class: 'rotulo' }, 'Quantidade', qtd),
      acoes: [{ texto: 'Cancelar', acao: x => x() }, { texto: 'Adicionar', primario: true, acao: (x) => { G.adicionarCombatente(dados, Math.max(1, +qtd.value || 1)); x(); } }]
    });
  };

  G.adicionarGrupo = function () {
    const pjs = G.loja.lista('jogador');
    if (!pjs.length) return G.aviso('Cadastre os personagens em Biblioteca → Grupo (PJs)', 'erro', 4000);
    const ja = new Set(est().participantes.map(p => p.entidadeId));
    const novos = pjs.filter(p => !ja.has(p.id));
    if (!novos.length) return G.aviso('O grupo já está no combate');
    novos.forEach(e => G.adicionarCombatente({ nome: e.titulo, tipo: 'pj', modIni: e.ficha && e.ficha.ini, pv: e.ficha && e.ficha.pv, ca: e.ficha && e.ficha.ca, entidadeId: e.id }, 1, { rolar: false, silencioso: true }));
    G.aviso(novos.length === 1 ? '1 personagem adicionado — digite a iniciativa rolada' : `${novos.length} personagens adicionados — digite as iniciativas roladas`, 'ok', 3500);
  };

  function iniciarTurno(p) {
    if (!p) return;
    const fim = [];
    p.condicoes = p.condicoes.filter(c => { if (c.rodadas == null) return true; c.rodadas -= 1; if (c.rodadas <= 0) { fim.push(c.nome); return false; } return true; });
    if (fim.length) { log(`${p.nome}: terminou ${fim.join(', ')}`); G.aviso(`${p.nome}: ${fim.join(', ')} terminou`, 'info', 3500); }
  }
  function proximo() {
    const s = est();
    if (!s.participantes.length) return;
    if (!s.iniciado) return iniciar();
    G.vibrar(10);
    s.turno++;
    if (s.turno >= s.participantes.length) { s.turno = 0; s.rodada++; log(`— Rodada ${s.rodada} —`); }
    aberto = null;
    iniciarTurno(s.participantes[s.turno]);
    salvar();
  }
  function anterior() {
    const s = est();
    if (!s.iniciado) return;
    s.turno--;
    if (s.turno < 0) { if (s.rodada > 1) { s.rodada--; s.turno = s.participantes.length - 1; } else s.turno = 0; }
    salvar();
  }
  function iniciar() {
    const s = est();
    const sem = s.participantes.filter(p => p.ini == null);
    if (sem.length) G.aviso('Sem iniciativa: ' + sem.map(p => p.nome).join(', '), 'erro', 4000);
    ordenar();
    Object.assign(s, { iniciado: true, rodada: 1, turno: 0 });
    log('⚔️ Combate iniciado');
    iniciarTurno(s.participantes[0]);
    salvar();
  }
  function encerrar() {
    const s = est();
    const corpo = h('div', null,
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'pjs', checked: true }), ' Manter só os PJs'),
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'tudo' }), ' Remover todos'),
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'pausa' }), ' Só parar o contador'));
    G.folha({
      titulo: 'Encerrar combate', corpo, acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Encerrar', primario: true, acao: (f) => {
          const v = G.$('input[name=enc]:checked', corpo).value;
          if (v === 'tudo') s.participantes = [];
          if (v === 'pjs') s.participantes = s.participantes.filter(p => p.tipo === 'pj').map(p => Object.assign(p, { ini: null, condicoes: [], pvTemp: 0 }));
          if (G.loja.meta.mesa.sessaoId) G.anotarNaSessao(`Combate encerrado na rodada ${s.rodada}`);
          log(`🏁 Encerrado na rodada ${s.rodada}`);
          Object.assign(s, { iniciado: false, rodada: 1, turno: 0 });
          salvar(); f();
        }
      }]
    });
  }

  function aplicar(p, v, modo) {
    v = Math.abs(parseInt(v, 10) || 0);
    if (!v) return;
    G.vibrar(15);
    if (modo === 'cura') { p.pv = p.pvMax ? Math.min(p.pvMax, p.pv + v) : p.pv + v; log(`${p.nome} +${v} PV (${p.pv})`); }
    else if (modo === 'temp') { p.pvTemp = v; log(`${p.nome}: ${v} PV temporários`); }
    else {
      let r = v;
      if (p.pvTemp) { const a = Math.min(p.pvTemp, r); p.pvTemp -= a; r -= a; }
      p.pv -= r;
      log(`${p.nome} −${v} PV (${p.pv})`);
      if (p.pv <= 0 && p.tipo !== 'pj') G.aviso(`${p.nome} caiu!`, 'info');
    }
    salvar();
  }

  function estadoVida(p) {
    if (!p.pvMax) return { rot: '', cls: '' };
    if (p.pv <= 0) return p.tipo === 'pj' ? { rot: p.pv === 0 ? 'Incapacitado' : 'Morrendo', cls: 'caido' } : { rot: 'Abatido', cls: 'abatido' };
    const f = p.pv / p.pvMax;
    return { rot: f <= 0.25 ? 'Muito ferido' : f <= 0.5 ? 'Ferido' : '', cls: f <= 0.25 ? 'critico' : f <= 0.5 ? 'medio' : '' };
  }

  function janelaCondicao(p) {
    let escolhida = '';
    const rod = h('input', { class: 'campo', type: 'number', inputmode: 'numeric', min: 1, placeholder: 'sem limite' });
    const outra = h('input', { class: 'campo', placeholder: 'Outra…' });
    const grade = h('div', { class: 'chips' }, CONDICOES.map(c => h('button', { class: 'chip', onclick: (ev) => { escolhida = c; G.$$('.chip', grade).forEach(b => b.classList.toggle('sel', b === ev.target)); } }, c)));
    G.folha({
      titulo: 'Condição · ' + p.nome, cheia: true, corpo: h('div', null, grade, h('div', { class: 'linha-campos' }, h('label', { class: 'rotulo' }, 'Rodadas', rod), h('label', { class: 'rotulo' }, 'Ou digite', outra))),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Aplicar', primario: true, acao: (f) => {
          const nome = outra.value.trim() || escolhida;
          if (!nome) return G.aviso('Escolha uma condição', 'erro');
          p.condicoes = p.condicoes.filter(c => c.nome !== nome);
          p.condicoes.push({ nome, rodadas: rod.value ? +rod.value : null });
          log(`${p.nome}: ${nome}${rod.value ? ` (${rod.value} rod.)` : ''}`);
          salvar(); f();
        }
      }]
    });
  }

  function janelaRapido() {
    const nome = h('input', { class: 'campo', placeholder: 'Nome' });
    const tipo = h('select', { class: 'campo' }, Object.entries(TIPOS_P).map(([k, v]) => h('option', { value: k, selected: k === 'monstro' }, v)));
    const num = (ph) => h('input', { class: 'campo', type: 'number', inputmode: 'numeric', placeholder: ph });
    const ini = num('Iniciativa'), mod = num('Mod. (rola)'), pv = num('PV'), ca = num('CA'), qtd = num('Qtd');
    qtd.value = 1;
    G.folha({
      titulo: 'Adicionar rápido', corpo: h('div', { class: 'form-grade' }, nome, tipo, ini, mod, pv, ca, qtd),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, { texto: 'Adicionar', primario: true, acao: (f) => { if (!nome.value.trim()) return; G.adicionarCombatente({ nome: nome.value.trim(), tipo: tipo.value, ini: ini.value, modIni: mod.value, pv: pv.value, ca: ca.value }, Math.max(1, +qtd.value || 1)); f(); } }]
    });
    setTimeout(() => nome.focus(), 80);
  }

  function editarIni(p) {
    G.perguntar(`Iniciativa de ${p.nome}`, p.ini ?? '', 'resultado do d20 + mod').then(v => {
      if (v === null) return;
      p.ini = v === '' ? null : +v;
      ordenar(); salvar();
    });
  }

  G.telaCombate = function (alvo) {
    const caixa = h('div', { class: 'combate' });
    const desenhar = () => {
      const s = est();
      caixa.innerHTML = '';
      caixa.append(
        h('div', { class: 'combate-topo' },
          h('div', { class: 'rodada' }, h('small', null, 'Rodada'), h('b', null, s.iniciado ? s.rodada : '—')),
          h('div', { class: 'combate-add' },
            h('button', { class: 'btn pequeno', onclick: G.adicionarGrupo }, '🧙 Grupo'),
            h('button', { class: 'btn pequeno', onclick: () => G.buscar({ titulo: 'Da biblioteca', permitirCriar: false, filtro: (e) => G.TIPOS[e.tipo].ficha, aoEscolher: (e) => G.enviarAoCombate(e) }) }, '🐉 Biblioteca'),
            h('button', { class: 'btn pequeno', onclick: janelaRapido }, '＋ Rápido')),
          h('details', { class: 'menu' }, h('summary', { class: 'btn-icone grande' }, '⋯'), h('div', { class: 'menu-lista' },
            h('button', { onclick: () => { s.participantes.forEach(p => { if (p.ini == null && p.tipo !== 'pj') p.ini = G.dados.d(20) + (+p.desempate || 0); }); ordenar(); salvar(); } }, '🎲 Rolar iniciativas faltantes'),
            s.iniciado ? h('button', { onclick: encerrar }, '⏹ Encerrar combate') : null,
            h('button', { class: 'perigo', onclick: async () => { if (await G.confirmar('Remover todos do combate?', 'Limpar')) { s.participantes = []; Object.assign(s, { iniciado: false, rodada: 1, turno: 0 }); salvar(); } } }, '🗑 Limpar tudo')))));

      if (!s.participantes.length) {
        caixa.append(h('div', { class: 'vazio' }, h('div', { class: 'vazio-icone' }, '⚔️'), h('p', null, 'Ninguém no combate. Adicione o grupo e as criaturas da biblioteca.')));
        return;
      }
      const lista = h('div', { class: 'ini-lista' });
      s.participantes.forEach((p, i) => {
        const ativo = s.iniciado && i === s.turno;
        const vida = estadoVida(p);
        const pct = p.pvMax ? G.limitar(p.pv / p.pvMax, 0, 1) * 100 : 0;
        const exp = aberto === p.id;
        const linha = h('div', { class: `ini tipo-${p.tipo} ${ativo ? 'ativo' : ''} ${vida.cls} ${exp ? 'aberto' : ''}` },
          h('div', { class: 'ini-resumo', onclick: (ev) => { if (ev.target.closest('.ini-num')) return; aberto = exp ? null : p.id; desenhar(); } },
            h('button', { class: 'ini-num' + (p.ini == null ? ' falta' : ''), onclick: () => editarIni(p) }, p.ini ?? '?'),
            h('div', { class: 'ini-info' },
              h('div', { class: 'ini-nome' }, p.nome, vida.rot ? h('small', { class: 'vida' }, ' ' + vida.rot) : null),
              p.pvMax ? h('div', { class: 'barra-pv' }, h('i', { style: { width: pct + '%' } })) : null,
              p.condicoes.length ? h('div', { class: 'ini-conds' }, p.condicoes.map(c => h('span', { class: 'cond' }, c.nome + (c.rodadas ? ` ${c.rodadas}r` : '')))) : null),
            h('div', { class: 'ini-num-dir' },
              p.pvMax || p.pv ? h('b', null, p.pv, p.pvTemp ? h('small', { class: 'temp' }, '+' + p.pvTemp) : null) : null,
              p.ca ? h('small', null, '🛡' + p.ca) : null)));
        if (exp) linha.appendChild(painel(p));
        lista.appendChild(linha);
      });
      caixa.append(lista,
        s.log && s.log.length ? h('details', { class: 'bloco log' }, h('summary', null, 'Registro do combate'), h('ul', null, s.log.slice(0, 20).map(l => h('li', null, h('small', null, `${l.t} R${l.r} `), l.texto)))) : null,
        h('div', { class: 'botoes-turno' },
          s.iniciado ? h('button', { class: 'btn redondo', onclick: anterior, 'aria-label': 'Turno anterior' }, '◀') : null,
          h('button', { class: 'btn primario turno', onclick: proximo }, s.iniciado ? 'Próximo turno ▶' : '▶ Iniciar combate')));
      const a = G.$('.ini.ativo', caixa);
      if (a && !aberto) a.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    function painel(p) {
      const s = est();
      const valor = h('input', { class: 'campo valor-pv', type: 'number', inputmode: 'numeric', placeholder: 'valor' });
      const e = p.entidadeId ? G.loja.obter(p.entidadeId) : null;
      return h('div', { class: 'ini-painel' },
        h('div', { class: 'pv-linha' },
          h('div', { class: 'pv-editar' }, 'PV ',
            h('input', { class: 'campo mini', type: 'number', inputmode: 'numeric', value: p.pv, onchange: (ev) => { p.pv = +ev.target.value || 0; salvar(); } }), ' / ',
            h('input', { class: 'campo mini', type: 'number', inputmode: 'numeric', value: p.pvMax || '', placeholder: 'máx', onchange: (ev) => { p.pvMax = +ev.target.value || 0; if (!p.pv) p.pv = p.pvMax; salvar(); } })),
          h('select', { class: 'campo mini-sel', onchange: (ev) => { p.tipo = ev.target.value; ordenar(); salvar(); } }, Object.entries(TIPOS_P).map(([k, v]) => h('option', { value: k, selected: k === p.tipo }, v)))),
        h('div', { class: 'pv-acoes' }, valor,
          h('button', { class: 'btn dano', onclick: () => aplicar(p, valor.value, 'dano') }, '− Dano'),
          h('button', { class: 'btn cura', onclick: () => aplicar(p, valor.value, 'cura') }, '+ Cura'),
          h('button', { class: 'btn', onclick: () => aplicar(p, valor.value, 'temp') }, 'Temp')),
        h('div', { class: 'pv-rapido' }, [1, 2, 5, 10].map(n => h('button', { class: 'chip', onclick: () => aplicar(p, n, 'dano') }, '−' + n))),
        h('div', { class: 'chips' },
          p.condicoes.map(c => h('button', { class: 'chip cond', onclick: () => { p.condicoes = p.condicoes.filter(x => x !== c); log(`${p.nome}: sem ${c.nome}`); salvar(); } }, c.nome + (c.rodadas ? ` ${c.rodadas}r` : '') + ' ×')),
          h('button', { class: 'chip adicionar', onclick: () => janelaCondicao(p) }, '+ condição')),
        e && e.ficha ? h('details', { class: 'ficha-combate', open: p.tipo !== 'pj' }, h('summary', null, 'Ficha'), G.statblock.render(e.ficha, p.nome)) : null,
        h('div', { class: 'linha-botoes' },
          e ? h('button', { class: 'btn pequeno', onclick: () => G.verRapido(e.id) }, '📖 Página') : null,
          h('button', { class: 'btn pequeno', onclick: () => { G.perguntar('Renomear', p.nome).then(v => { if (v) { p.nome = v; ordenar(); salvar(); } }); } }, '✎ Nome'),
          h('button', { class: 'btn pequeno', onclick: () => { const c = JSON.parse(JSON.stringify(p)); c.id = G.uid(); c.nome = p.nome.replace(/\s+\d+$/, '') + ' ' + (s.participantes.length + 1); c.pv = c.pvMax; c.condicoes = []; c.pvTemp = 0; s.participantes.push(c); ordenar(); salvar(); } }, '⧉ Duplicar'),
          h('button', {
            class: 'btn pequeno perigo-txt', onclick: () => {
              const idx = s.participantes.indexOf(p);
              s.participantes.splice(idx, 1);
              if (idx < s.turno) s.turno--;
              if (s.turno >= s.participantes.length) s.turno = 0;
              aberto = null; log(`${p.nome} saiu`); salvar();
            }
          }, '✕ Remover')));
    }

    alvo.appendChild(caixa);
    desenhar();
    const off = G.on('iniciativa', desenhar);
    const offMeta = G.on('meta', desenhar);
    const tecla = (ev) => {
      if (ev.target.closest('input, textarea, select') || G.$('.folha-fundo')) return;
      if (ev.code === 'Space') { ev.preventDefault(); ev.shiftKey ? anterior() : proximo(); }
    };
    document.addEventListener('keydown', tecla);
    return () => { off(); offMeta(); document.removeEventListener('keydown', tecla); };
  };
})();
