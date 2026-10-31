// Rastreador de iniciativa e combate
(function () {
  const { h } = G;
  const CONDICOES = ['Abalado', 'Agarrado', 'Amedrontado', 'Apavorado', 'Atordoado', 'Caído', 'Cego', 'Confuso', 'Desprevenido',
    'Enjoado', 'Enredado', 'Exausto', 'Fascinado', 'Fatigado', 'Imobilizado', 'Inconsciente', 'Invisível', 'Morrendo',
    'Nauseado', 'Ofuscado', 'Paralisado', 'Pasmo', 'Petrificado', 'Sangrando', 'Surdo', 'Estável', 'Abençoado', 'Acelerado', 'Lento'];
  const TIPOS_P = { pj: 'PJ', npc: 'NPC', monstro: 'Monstro' };
  G.CONDICOES = CONDICOES;

  const est = () => G.estado.camp.iniciativa;
  const salvar = () => { G.estado.salvar(); G.emitir('iniciativa'); };
  const log = (texto) => { const s = est(); s.log = s.log || []; s.log.unshift({ t: G.horaAgora(), r: s.rodada, texto }); s.log.splice(60); };

  function ordenar() {
    const s = est();
    const ativo = s.participantes[s.turno] && s.participantes[s.turno].id;
    const ordemTipo = { pj: 0, npc: 1, monstro: 2 };
    s.participantes.sort((a, b) =>
      ((b.ini ?? -99) - (a.ini ?? -99)) || ((+b.desempate || 0) - (+a.desempate || 0)) ||
      (ordemTipo[a.tipo] - ordemTipo[b.tipo]) || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    if (ativo) s.turno = Math.max(0, s.participantes.findIndex(p => p.id === ativo));
  }

  function nomeUnico(base) {
    const nomes = new Set(est().participantes.map(p => p.nome));
    if (!nomes.has(base)) return base;
    const raiz = base.replace(/\s+\d+$/, '');
    let n = 2;
    while (nomes.has(`${raiz} ${n}`)) n++;
    return `${raiz} ${n}`;
  }

  // API usada por outras telas (bestiário, páginas, encontros)
  G.adicionarCombatente = function (dados, qtd = 1, { rolar = true, silencioso = false } = {}) {
    const s = est();
    const adicionados = [];
    for (let i = 0; i < qtd; i++) {
      const mod = parseInt(dados.modIni ?? dados.iniciativa ?? 0, 10) || 0;
      const tipo = dados.tipo || 'monstro';
      let nome;
      if (qtd > 1) {
        const usados = new Set(s.participantes.map(p => p.nome));
        let n = 1;
        while (usados.has(`${dados.nome} ${n}`)) n++;
        nome = `${dados.nome} ${n}`;
      } else nome = nomeUnico(dados.nome);
      const p = {
        id: G.uid(), nome, tipo,
        ini: dados.ini != null && dados.ini !== '' ? +dados.ini : (rolar && tipo !== 'pj' ? G.dados.d(20) + mod : null),
        desempate: mod,
        pvMax: +dados.pv || +dados.pvMax || 0, pv: +dados.pv || +dados.pvMax || 0, pvTemp: 0,
        ca: dados.ca || '', condicoes: [], notas: dados.notas || '',
        entidadeId: dados.entidadeId || null, srd: dados.srd || null
      };
      s.participantes.push(p);
      adicionados.push(p);
    }
    ordenar();
    log(`Entrou no combate: ${adicionados.map(p => p.nome).join(', ')}`);
    salvar();
    if (!silencioso) G.aviso(`${adicionados.length > 1 ? adicionados.length + '× ' : ''}${dados.nome} adicionado ao combate`);
    return adicionados;
  };

  G.enviarAoCombate = function (e) {
    if (e.tipo === 'jogador') {
      return G.adicionarCombatente({ nome: e.titulo, tipo: 'pj', modIni: e.campos.iniciativa, pv: e.campos.pvMax, ca: e.campos.ca, entidadeId: e.id }, 1, { rolar: false });
    }
    const qtdInp = h('input', { class: 'campo', type: 'number', min: 1, value: 1 });
    G.modal({
      titulo: `Adicionar "${e.titulo}" ao combate`,
      corpo: h('label', { class: 'rotulo' }, 'Quantidade', qtdInp),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Adicionar', primario: true, acao: f => {
          G.adicionarCombatente({ nome: e.titulo, tipo: e.tipo === 'npc' ? 'npc' : 'monstro', modIni: e.campos.iniciativa, pv: e.campos.pv || e.campos.pvMax, ca: e.campos.ca, entidadeId: e.id }, +qtdInp.value || 1);
          f();
        }
      }]
    });
  };

  G.adicionarGrupo = function () {
    const pjs = G.estado.lista('jogador');
    if (!pjs.length) return G.aviso('Nenhum personagem cadastrado em "Personagens (PJs)".', 'erro');
    const ja = new Set(est().participantes.map(p => p.entidadeId));
    const novos = pjs.filter(p => !ja.has(p.id));
    if (!novos.length) return G.aviso('O grupo já está no combate.');
    novos.forEach(e => G.adicionarCombatente({ nome: e.titulo, tipo: 'pj', modIni: e.campos.iniciativa, pv: e.campos.pvMax, ca: e.campos.ca, entidadeId: e.id }, 1, { rolar: false, silencioso: true }));
    G.aviso(`${novos.length === 1 ? '1 personagem adicionado' : novos.length + ' personagens adicionados'}. Digite a iniciativa que cada jogador rolou.`);
  };

  function iniciarTurno(p) {
    if (!p) return;
    const terminadas = [];
    p.condicoes = p.condicoes.filter(c => {
      if (c.rodadas == null || c.rodadas === '') return true;
      c.rodadas = +c.rodadas - 1;
      if (c.rodadas <= 0) { terminadas.push(c.nome); return false; }
      return true;
    });
    if (terminadas.length) {
      log(`${p.nome}: terminou ${terminadas.join(', ')}`);
      G.aviso(`${p.nome}: ${terminadas.join(', ')} terminou`, 'info', 3500);
    }
  }

  function proximo() {
    const s = est();
    if (!s.participantes.length) return;
    if (!s.iniciado) return iniciar();
    s.turno++;
    if (s.turno >= s.participantes.length) { s.turno = 0; s.rodada++; log(`— Rodada ${s.rodada} —`); }
    iniciarTurno(s.participantes[s.turno]);
    salvar();
  }
  function anterior() {
    const s = est();
    if (!s.iniciado || !s.participantes.length) return;
    s.turno--;
    if (s.turno < 0) { if (s.rodada > 1) { s.rodada--; s.turno = s.participantes.length - 1; } else s.turno = 0; }
    salvar();
  }
  function iniciar() {
    const s = est();
    const semIni = s.participantes.filter(p => p.ini == null || p.ini === '');
    if (semIni.length) G.aviso(`Sem iniciativa: ${semIni.map(p => p.nome).join(', ')}`, 'erro', 4000);
    ordenar();
    s.iniciado = true; s.rodada = 1; s.turno = 0;
    log('⚔️ Combate iniciado');
    iniciarTurno(s.participantes[0]);
    salvar();
  }
  async function encerrar() {
    const s = est();
    const corpo = h('div', null,
      h('p', null, 'O que fazer com os participantes?'),
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'manter-pjs', checked: true }), ' Manter só os PJs (limpa iniciativa e condições)'),
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'tudo' }), ' Remover todos'),
      h('label', { class: 'opcao' }, h('input', { type: 'radio', name: 'enc', value: 'pausar' }), ' Só parar o contador (manter tudo como está)'));
    G.modal({
      titulo: 'Encerrar combate', corpo,
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Encerrar', primario: true, acao: f => {
          const v = G.$('input[name=enc]:checked', corpo).value;
          if (v === 'tudo') s.participantes = [];
          if (v === 'manter-pjs') s.participantes = s.participantes.filter(p => p.tipo === 'pj').map(p => Object.assign(p, { ini: null, condicoes: [], pvTemp: 0 }));
          log(`🏁 Combate encerrado na rodada ${s.rodada}`);
          s.iniciado = false; s.rodada = 1; s.turno = 0;
          salvar(); f();
        }
      }]
    });
  }

  function aplicar(p, valor, cura) {
    valor = Math.abs(parseInt(valor, 10) || 0);
    if (!valor) return;
    if (cura) {
      p.pv = p.pvMax ? Math.min(p.pvMax, p.pv + valor) : p.pv + valor;
      log(`${p.nome} recuperou ${valor} PV (${p.pv})`);
    } else {
      let resto = valor;
      if (p.pvTemp) { const abs = Math.min(p.pvTemp, resto); p.pvTemp -= abs; resto -= abs; }
      p.pv -= resto;
      log(`${p.nome} sofreu ${valor} de dano (${p.pv} PV)`);
      if (p.pv <= 0 && p.tipo !== 'pj') G.aviso(`${p.nome} caiu!`, 'info');
    }
    salvar();
  }

  function estadoVida(p) {
    if (!p.pvMax) return { rot: '', cls: '' };
    if (p.pv <= 0) return p.tipo === 'pj' ? { rot: p.pv === 0 ? 'Incapacitado' : 'Morrendo', cls: 'caido' } : { rot: 'Abatido', cls: 'abatido' };
    const f = p.pv / p.pvMax;
    return { rot: f <= 0.25 ? 'Muito ferido' : f <= 0.5 ? 'Ferido' : '', cls: f <= 0.25 ? 'critico' : f <= 0.5 ? 'medio' : 'bom' };
  }

  function janelaCondicao(p) {
    const rod = h('input', { class: 'campo', type: 'number', min: 1, placeholder: 'sem limite' });
    const outro = h('input', { class: 'campo', placeholder: 'Outra condição…' });
    let escolhida = '';
    const grade = h('div', { class: 'grade-condicoes' }, CONDICOES.map(c => h('button', {
      class: 'chip' + (p.condicoes.some(x => x.nome === c) ? ' ativo' : ''),
      onclick: (ev) => { escolhida = c; G.$$('.chip', grade).forEach(b => b.classList.toggle('sel', b === ev.target)); }
    }, c)));
    G.modal({
      titulo: `Condição em ${p.nome}`, largura: 600,
      corpo: h('div', null, grade, h('div', { class: 'linha-campos' }, h('label', { class: 'rotulo' }, 'Duração (rodadas)', rod), h('label', { class: 'rotulo' }, 'Ou digite', outro))),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Aplicar', primario: true, acao: f => {
          const nome = outro.value.trim() || escolhida;
          if (!nome) return G.aviso('Escolha uma condição', 'erro');
          p.condicoes = p.condicoes.filter(c => c.nome !== nome);
          p.condicoes.push({ nome, rodadas: rod.value ? +rod.value : null });
          log(`${p.nome}: ${nome}${rod.value ? ` (${rod.value} rodadas)` : ''}`);
          salvar(); f();
        }
      }]
    });
  }

  // Seletor de criaturas (bestiário + criaturas e NPCs da campanha)
  G.janelaEscolherCriatura = function () {
    const busca = h('input', { class: 'campo', placeholder: 'Buscar criatura, NPC ou PJ…' });
    const qtd = h('input', { class: 'campo qtd', type: 'number', min: 1, value: 1, title: 'Quantidade' });
    const lista = h('div', { class: 'lista-escolha' });
    const fontes = () => [
      ...G.estado.lista('criatura').map(e => ({ nome: e.titulo, sub: 'Campanha · ND ' + (e.campos.nd || '?'), add: (n) => G.adicionarCombatente({ nome: e.titulo, modIni: e.campos.iniciativa, pv: e.campos.pv, ca: e.campos.ca, entidadeId: e.id }, n) })),
      ...G.estado.lista('npc').map(e => ({ nome: e.titulo, sub: 'NPC', add: (n) => G.adicionarCombatente({ nome: e.titulo, tipo: 'npc', modIni: e.campos.iniciativa, pv: e.campos.pv, ca: e.campos.ca, entidadeId: e.id }, n) })),
      ...G.estado.lista('jogador').map(e => ({ nome: e.titulo, sub: 'PJ', add: () => G.enviarAoCombate(e) })),
      ...G.BESTIARIO.map(c => ({ nome: c.nome, sub: `Bestiário · ND ${c.nd} · ${c.tipo}`, add: (n) => G.adicionarCombatente({ nome: c.nome, modIni: c.ini, pv: c.pv, ca: c.ca, srd: c.id }, n) }))
    ];
    const desenhar = () => {
      const q = G.normalizar(busca.value);
      lista.innerHTML = '';
      fontes().filter(f => !q || G.normalizar(f.nome + ' ' + f.sub).includes(q)).slice(0, 60).forEach(f =>
        lista.appendChild(h('button', { class: 'item-escolha', onclick: () => { f.add(+qtd.value || 1); } }, h('b', null, f.nome), h('small', null, f.sub))));
    };
    busca.addEventListener('input', desenhar);
    G.modal({ titulo: 'Adicionar ao combate', largura: 620, corpo: h('div', null, h('div', { class: 'linha-campos' }, busca, qtd), lista), acoes: [{ texto: 'Fechar', primario: true, acao: f => f() }] });
    desenhar();
  };

  // ---------- Tela ----------
  G.rota('iniciativa', (alvo) => {
    const s = est();
    const corpo = h('div');
    const form = formAdicionar();
    alvo.append(
      h('div', { class: 'cab-pagina' },
        h('h1', null, h('span', { class: 'cab-icone' }, '⚔️'), 'Iniciativa'),
        h('div', { class: 'acoes-cab' },
          h('button', { class: 'btn', onclick: G.adicionarGrupo }, '🧙 + Grupo'),
          h('button', { class: 'btn', onclick: G.janelaEscolherCriatura }, '🐉 + Criatura'))),
      form, corpo);

    const desenhar = () => {
      corpo.innerHTML = '';
      corpo.appendChild(G.painelIniciativa({ completo: true }));
    };
    desenhar();
    const off = G.on('iniciativa', desenhar);
    const tecla = (ev) => {
      if (ev.target.closest('input, textarea, select') || G.$('.modal-fundo')) return;
      if (ev.code === 'Space') { ev.preventDefault(); ev.shiftKey ? anterior() : proximo(); }
      if (ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); G.$('.form-ini input', alvo).focus(); }
      if (ev.key === 'g' || ev.key === 'G') G.adicionarGrupo();
      if (ev.key === 'c' || ev.key === 'C') G.janelaEscolherCriatura();
    };
    document.addEventListener('keydown', tecla);
    return () => { off(); document.removeEventListener('keydown', tecla); };
  });

  function formAdicionar() {
    const nome = h('input', { class: 'campo', placeholder: 'Nome (N)', required: true });
    const tipo = h('select', { class: 'campo' }, Object.entries(TIPOS_P).map(([k, v]) => h('option', { value: k, selected: k === 'monstro' }, v)));
    const ini = h('input', { class: 'campo curto', type: 'number', placeholder: 'Inic.', title: 'Valor da iniciativa (deixe vazio e informe o modificador para rolar)' });
    const mod = h('input', { class: 'campo curto', type: 'number', placeholder: 'Mod.', title: 'Modificador de iniciativa (rola d20 + mod se o valor ficar vazio)' });
    const pv = h('input', { class: 'campo curto', type: 'number', placeholder: 'PV' });
    const ca = h('input', { class: 'campo curto', type: 'number', placeholder: 'CA' });
    const qtd = h('input', { class: 'campo curto', type: 'number', min: 1, value: 1, title: 'Quantidade' });
    const f = h('form', {
      class: 'form-ini', onsubmit: (ev) => {
        ev.preventDefault();
        if (!nome.value.trim()) return;
        G.adicionarCombatente({ nome: nome.value.trim(), tipo: tipo.value, ini: ini.value, modIni: mod.value, pv: pv.value, ca: ca.value }, +qtd.value || 1, { rolar: true, silencioso: true });
        nome.value = ''; ini.value = ''; qtd.value = 1; nome.focus();
      }
    }, nome, tipo, ini, mod, pv, ca, h('span', { class: 'x' }, '×'), qtd, h('button', { class: 'btn primario' }, 'Adicionar'));
    return f;
  }

  // Painel reutilizável (tela completa e Mesa ao vivo)
  G.painelIniciativa = function ({ completo }) {
    const s = est();
    const caixa = h('div', { class: 'iniciativa' + (completo ? '' : ' compacta') });
    const controles = h('div', { class: 'ini-controles' },
      h('div', { class: 'rodada' }, h('small', null, 'Rodada'), h('b', null, s.iniciado ? s.rodada : '—')),
      s.iniciado
        ? [h('button', { class: 'btn', onclick: anterior, title: 'Shift+Espaço' }, '⏮'),
          h('button', { class: 'btn primario', onclick: proximo, title: 'Espaço' }, 'Próximo turno ⏭'),
          h('button', { class: 'btn', onclick: encerrar }, '⏹ Encerrar')]
        : h('button', { class: 'btn primario', onclick: iniciar, disabled: !s.participantes.length }, '▶ Iniciar combate'),
      completo ? h('button', {
        class: 'btn', title: 'Rola d20 + modificador para quem está sem iniciativa (exceto PJs)', onclick: () => {
          s.participantes.forEach(p => { if ((p.ini == null || p.ini === '') && p.tipo !== 'pj') p.ini = G.dados.d(20) + (+p.desempate || 0); });
          ordenar(); salvar();
        }
      }, '🎲 Rolar faltantes') : null,
      completo && s.participantes.length ? h('button', { class: 'btn', onclick: async () => { if (await G.confirmar('Remover todos do combate?', 'Limpar')) { s.participantes = []; s.iniciado = false; s.rodada = 1; s.turno = 0; salvar(); } } }, '🗑 Limpar') : null
    );
    caixa.appendChild(controles);

    if (!s.participantes.length) {
      caixa.appendChild(h('div', { class: 'vazio-pequeno' }, 'Ninguém no combate. Adicione o grupo, criaturas do bestiário ou digite acima.'));
      return caixa;
    }

    const lista = h('div', { class: 'ini-lista' });
    s.participantes.forEach((p, i) => {
      const ativo = s.iniciado && i === s.turno;
      const vida = estadoVida(p);
      const pct = p.pvMax ? G.limitar(p.pv / p.pvMax, 0, 1) * 100 : 0;
      const valor = h('input', { class: 'campo mini', type: 'number', min: 0, placeholder: '±' });
      const linha = h('div', { class: `ini-linha tipo-${p.tipo} ${ativo ? 'ativo' : ''} ${vida.cls}` },
        h('input', {
          class: 'ini-valor' + (p.ini == null || p.ini === '' ? ' falta' : ''), type: 'number', value: p.ini ?? '', title: 'Iniciativa',
          onchange: (ev) => { p.ini = ev.target.value === '' ? null : +ev.target.value; ordenar(); salvar(); }
        }),
        h('div', { class: 'ini-nome' },
          h('input', { class: 'ini-nome-campo', value: p.nome, onchange: (ev) => { p.nome = ev.target.value.trim() || p.nome; salvar(); } }),
          h('div', { class: 'ini-meta' },
            h('select', { class: 'selo-ini tipo-' + p.tipo, onchange: (ev) => { p.tipo = ev.target.value; ordenar(); salvar(); } },
              Object.entries(TIPOS_P).map(([k, v]) => h('option', { value: k, selected: k === p.tipo }, v))),
            p.ca ? h('span', { class: 'ca', title: 'Classe de Armadura' }, '🛡 ', p.ca) : null,
            vida.rot ? h('span', { class: 'estado-vida' }, vida.rot) : null,
            p.entidadeId && G.estado.obter(p.entidadeId) ? h('a', { href: '#/pagina/' + p.entidadeId, class: 'link-ficha', title: 'Abrir página' }, '↗') : null,
            p.srd ? h('button', { class: 'link-ficha', title: 'Ver bloco de estatísticas', onclick: () => G.verCriaturaSRD(p.srd) }, '📖') : null)),
        h('div', { class: 'ini-pv' },
          h('div', { class: 'barra-pv' }, h('div', { class: 'barra-pv-preench', style: { width: pct + '%' } })),
          h('div', { class: 'pv-texto' },
            h('input', { class: 'pv-atual', type: 'number', value: p.pv, title: 'PV atuais', onchange: (ev) => { p.pv = +ev.target.value || 0; salvar(); } }),
            ' / ',
            h('input', { class: 'pv-max', type: 'number', value: p.pvMax || '', placeholder: 'máx', title: 'PV máximos', onchange: (ev) => { p.pvMax = +ev.target.value || 0; if (!p.pv) p.pv = p.pvMax; salvar(); } }),
            p.pvTemp ? h('span', { class: 'pv-temp', title: 'PV temporários' }, ` +${p.pvTemp}`) : null),
          h('div', { class: 'pv-acoes' }, valor,
            h('button', { class: 'btn mini dano', title: 'Dano (Enter)', onclick: () => aplicar(p, valor.value, false) }, '−'),
            h('button', { class: 'btn mini cura', title: 'Cura', onclick: () => aplicar(p, valor.value, true) }, '+'),
            completo ? h('button', { class: 'btn mini', title: 'PV temporários', onclick: () => { const v = Math.abs(parseInt(valor.value, 10) || 0); if (v) { p.pvTemp = v; salvar(); } } }, 'T') : null)),
        h('div', { class: 'ini-condicoes' },
          p.condicoes.map(c => h('button', {
            class: 'chip condicao', title: 'Clique para remover',
            onclick: () => { p.condicoes = p.condicoes.filter(x => x !== c); log(`${p.nome}: removido ${c.nome}`); salvar(); }
          }, c.nome, c.rodadas ? h('small', null, ` ${c.rodadas}r`) : null, ' ×')),
          h('button', { class: 'chip adicionar', onclick: () => janelaCondicao(p) }, '+ condição')),
        completo ? h('div', { class: 'ini-acoes' },
          h('button', { class: 'btn-icone', title: 'Duplicar', onclick: () => { const c = JSON.parse(JSON.stringify(p)); c.id = G.uid(); c.nome = nomeUnico(p.nome); c.pv = c.pvMax; c.condicoes = []; c.pvTemp = 0; s.participantes.push(c); ordenar(); salvar(); } }, '⧉'),
          h('button', {
            class: 'btn-icone', title: 'Remover', onclick: () => {
              const idx = s.participantes.indexOf(p);
              s.participantes.splice(idx, 1);
              if (idx < s.turno) s.turno--;
              if (s.turno >= s.participantes.length) s.turno = 0;
              log(`${p.nome} saiu do combate`); salvar();
            }
          }, '✕')) : null
      );
      valor.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); aplicar(p, valor.value, ev.shiftKey); } });
      lista.appendChild(linha);
    });
    caixa.appendChild(lista);

    if (completo) {
      caixa.append(
        h('div', { class: 'dica atalhos' }, 'Atalhos: Espaço = próximo turno · Shift+Espaço = anterior · N = novo · G = grupo · C = criatura · no campo ±: Enter = dano, Shift+Enter = cura'),
        (s.log && s.log.length) ? h('details', { class: 'ini-log', open: true }, h('summary', null, 'Registro do combate'),
          h('ul', null, s.log.slice(0, 25).map(l => h('li', null, h('small', null, l.t + ' · R' + l.r), ' ', l.texto)))) : null);
    }
    setTimeout(() => { const a = G.$('.ini-linha.ativo', caixa); a && a.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
    return caixa;
  };

  G.on('iniciativa', G.debounce(() => G.renderizarBarra(), 50));
})();
