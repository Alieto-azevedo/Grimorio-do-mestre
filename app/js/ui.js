// Interface base: rotas, barra lateral, janelas, avisos, busca rápida
(function () {
  const { h } = G;

  // ---------- Avisos ----------
  G.aviso = function (texto, tipo = 'ok', ms = 2800) {
    const el = h('div', { class: 'aviso ' + tipo }, texto);
    G.$('#avisos').appendChild(el);
    setTimeout(() => el.classList.add('saindo'), ms);
    setTimeout(() => el.remove(), ms + 400);
  };

  // ---------- Janelas (modais) ----------
  G.modal = function ({ titulo, corpo, acoes = [], largura = 520, aoFechar }) {
    const camada = G.$('#camada-modal');
    const fundo = h('div', { class: 'modal-fundo' });
    const fechar = () => { fundo.remove(); document.removeEventListener('keydown', tecla, true); aoFechar && aoFechar(); };
    const tecla = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
      if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        const p = acoes.find(a => a.primario);
        if (p) { e.preventDefault(); e.stopPropagation(); p.acao(fechar); }
      }
    };
    const caixa = h('div', { class: 'modal', style: { width: largura + 'px' } },
      h('div', { class: 'modal-cab' }, h('h3', null, titulo), h('button', { class: 'btn-icone', onclick: fechar, title: 'Fechar' }, '✕')),
      h('div', { class: 'modal-corpo' }, corpo),
      acoes.length ? h('div', { class: 'modal-acoes' }, acoes.map(a =>
        h('button', { class: 'btn ' + (a.primario ? 'primario' : '') + (a.perigo ? ' perigo' : ''), onclick: () => a.acao(fechar) }, a.texto))) : null
    );
    fundo.appendChild(caixa);
    fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); });
    document.addEventListener('keydown', tecla, true);
    camada.appendChild(fundo);
    setTimeout(() => { const f = caixa.querySelector('input, select, textarea'); f && f.focus(); }, 30);
    return { fechar, caixa };
  };

  G.confirmar = (mensagem, textoOk = 'Confirmar', perigo = true) => new Promise(ok => {
    let resp = false;
    G.modal({
      titulo: 'Confirmar', corpo: h('p', null, mensagem),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, { texto: textoOk, primario: true, perigo, acao: f => { resp = true; f(); } }],
      aoFechar: () => ok(resp)
    });
  });

  G.perguntar = (titulo, inicial = '', dica = '') => new Promise(ok => {
    let resp = null;
    const inp = h('input', { class: 'campo', value: inicial, placeholder: dica });
    G.modal({
      titulo, corpo: inp,
      acoes: [{ texto: 'Cancelar', acao: f => f() }, { texto: 'OK', primario: true, acao: f => { resp = inp.value.trim(); f(); } }],
      aoFechar: () => ok(resp)
    });
    setTimeout(() => inp.select(), 40);
  });

  // ---------- Rotas ----------
  const rotas = {};
  let limparRota = null;
  G.rota = (nome, fn) => { rotas[nome] = fn; };
  G.ir = (caminho) => { if (location.hash === '#/' + caminho) renderizarRota(); else location.hash = '#/' + caminho; };
  G.rotaAtual = () => location.hash.replace(/^#\/?/, '') || 'painel';

  function renderizarRota() {
    if (!G.estado.camp) { G.mostrarCampanhas(); return; }
    const [nome, ...params] = G.rotaAtual().split('/').map(decodeURIComponent);
    const alvo = G.$('#conteudo');
    if (limparRota) { try { limparRota(); } catch { /* ignora */ } limparRota = null; }
    alvo.innerHTML = '';
    alvo.scrollTop = 0;
    const fn = rotas[nome] || rotas.painel;
    const r = fn(alvo, ...params);
    if (typeof r === 'function') limparRota = r;
    G.renderizarBarra();
  }
  G.recarregarRota = renderizarRota;
  window.addEventListener('hashchange', renderizarRota);

  // ---------- Barra lateral ----------
  G.renderizarBarra = function () {
    const barra = G.$('#barra-lateral');
    const camp = G.estado.camp;
    if (!camp) { barra.innerHTML = ''; return; }
    const atual = G.rotaAtual();
    const item = (rota, icone, texto, extra) => h('a', {
      href: '#/' + rota, class: 'nav-item' + (atual === rota || (rota !== 'painel' && atual.startsWith(rota + '/')) ? ' ativo' : '')
    }, h('span', { class: 'nav-icone' }, icone), h('span', { class: 'nav-texto' }, texto), extra ? h('span', { class: 'nav-extra' }, extra) : null);

    const contagem = {};
    for (const e of G.estado.lista()) contagem[e.tipo] = (contagem[e.tipo] || 0) + 1;
    const paginaAtual = atual.startsWith('pagina/') ? G.estado.obter(atual.split('/')[1]) : null;
    const ini = camp.iniciativa;

    barra.innerHTML = '';
    barra.append(
      h('div', { class: 'marca' },
        h('div', { class: 'marca-selo' }, '✦'),
        h('div', null, h('div', { class: 'marca-nome' }, 'Grimório do Mestre'),
          h('button', { class: 'camp-nome', onclick: () => G.mostrarCampanhas(), title: 'Trocar de campanha' }, camp.nome, ' ▾'))),
      h('nav', null,
        item('painel', '🏠', 'Painel'),
        item('mesa', '🕯️', 'Mesa ao vivo'),
        h('div', { class: 'nav-titulo' }, 'Campanha'),
        G.ORDEM_TIPOS.map(t => {
          const a = item('lista/' + t, G.TIPOS[t].icone, G.TIPOS[t].plural, contagem[t] || '');
          if (paginaAtual && paginaAtual.tipo === t) a.classList.add('ativo');
          return a;
        }),
        h('div', { class: 'nav-titulo' }, 'Ferramentas'),
        item('iniciativa', '⚔️', 'Iniciativa', ini.iniciado ? `R${ini.rodada}` : (ini.participantes.length || '')),
        item('encontros', '🗺️', 'Encontros'),
        item('bestiario', '🐉', 'Bestiário'),
        item('dados', '🎲', 'Dados'),
        item('geradores', '✨', 'Geradores')
      ),
      h('div', { class: 'barra-rodape' },
        h('span', { id: 'status-salvo', class: 'status-salvo' }, '✓ Salvo'),
        h('button', { class: 'btn-icone', title: 'Importar do Notion / backup', onclick: () => G.janelaImportar() }, '⤓'),
        h('button', { class: 'btn-icone', title: 'Alternar tema claro/escuro', onclick: alternarTema }, '◐'))
    );
  };

  function alternarTema() {
    const camp = G.estado.camp;
    camp.config.tema = camp.config.tema === 'pergaminho' ? 'taverna' : 'pergaminho';
    aplicarTema();
    G.estado.salvar();
  }
  G.aplicarTema = aplicarTema;
  function aplicarTema() {
    document.body.dataset.tema = (G.estado.camp && G.estado.camp.config.tema) || 'taverna';
  }

  G.on('salvando', () => { const s = G.$('#status-salvo'); if (s) { s.textContent = '… salvando'; s.classList.add('pendente'); } });
  G.on('salvo', () => { const s = G.$('#status-salvo'); if (s) { s.textContent = '✓ Salvo'; s.classList.remove('pendente'); } });
  G.on('entidades', G.debounce(() => G.renderizarBarra(), 50));

  // ---------- Links internos [[...]] em qualquer lugar ----------
  document.addEventListener('click', async (ev) => {
    const a = ev.target.closest('a.wiki');
    if (!a) return;
    ev.preventDefault();
    if (a.dataset.id) return G.ir('pagina/' + a.dataset.id);
    const titulo = a.dataset.titulo;
    G.escolherTipo(`Criar a página "${titulo}" como…`, (tipo) => {
      const e = G.estado.criar(tipo, { titulo });
      G.ir('pagina/' + e.id + '/editar');
    });
  });

  G.escolherTipo = function (titulo, aoEscolher) {
    const grade = h('div', { class: 'grade-tipos' }, G.ORDEM_TIPOS.map(t =>
      h('button', { class: 'tipo-botao cor-' + G.TIPOS[t].cor, onclick: () => { m.fechar(); aoEscolher(t); } },
        h('span', { class: 'tipo-icone' }, G.TIPOS[t].icone), G.TIPOS[t].nome)));
    const m = G.modal({ titulo, corpo: grade, largura: 560 });
  };

  // ---------- Busca rápida (Ctrl+K) ----------
  G.abrirBusca = function () {
    if (!G.estado.camp) return;
    const comandos = [
      ...G.ORDEM_TIPOS.map(t => ({ titulo: `Nova página: ${G.TIPOS[t].nome}`, icone: '＋', acao: () => { const e = G.estado.criar(t); G.ir('pagina/' + e.id + '/editar'); } })),
      { titulo: 'Ir para Iniciativa', icone: '⚔️', acao: () => G.ir('iniciativa') },
      { titulo: 'Ir para Mesa ao vivo', icone: '🕯️', acao: () => G.ir('mesa') },
      { titulo: 'Ir para Encontros', icone: '🗺️', acao: () => G.ir('encontros') },
      { titulo: 'Ir para Bestiário', icone: '🐉', acao: () => G.ir('bestiario') },
      { titulo: 'Ir para Geradores', icone: '✨', acao: () => G.ir('geradores') }
    ];
    const inp = h('input', { class: 'campo busca-campo', placeholder: 'Digite para buscar páginas ou comandos…' });
    const res = h('div', { class: 'busca-resultados' });
    let itens = [], sel = 0;
    const desenhar = () => {
      const q = G.normalizar(inp.value);
      const ents = G.estado.lista()
        .map(e => {
          const t = G.normalizar(e.titulo);
          let pts = 0;
          if (!q) pts = e.editado / 1e13;
          else if (t.startsWith(q)) pts = 3;
          else if (t.includes(q)) pts = 2;
          else if ((e.tags || []).some(x => G.normalizar(x).includes(q))) pts = 1.5;
          else if (q.length > 2 && G.normalizar(e.corpo).includes(q)) pts = 1;
          return { e, pts };
        })
        .filter(x => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 12)
        .map(({ e }) => ({ titulo: e.titulo, sub: G.TIPOS[e.tipo].nome, icone: G.TIPOS[e.tipo].icone, acao: () => G.ir('pagina/' + e.id) }));
      const cmds = comandos.filter(c => q && G.normalizar(c.titulo).includes(q)).slice(0, 5);
      itens = [...ents, ...cmds];
      if (q && !G.estado.porTitulo(inp.value)) {
        itens.push({ titulo: `Criar página "${inp.value.trim()}"`, icone: '＋', acao: () => G.escolherTipo('Tipo da nova página', t => { const e = G.estado.criar(t, { titulo: inp.value.trim() }); G.ir('pagina/' + e.id + '/editar'); }) });
      }
      sel = G.limitar(sel, 0, Math.max(0, itens.length - 1));
      res.innerHTML = '';
      itens.forEach((it, i) => res.appendChild(h('div', {
        class: 'busca-item' + (i === sel ? ' sel' : ''),
        onmousedown: (ev) => { ev.preventDefault(); m.fechar(); it.acao(); }
      }, h('span', { class: 'busca-icone' }, it.icone), h('span', { class: 'busca-titulo' }, it.titulo), it.sub ? h('span', { class: 'busca-sub' }, it.sub) : null)));
      if (!itens.length) res.appendChild(h('div', { class: 'vazio-pequeno' }, 'Nada encontrado.'));
    };
    inp.addEventListener('input', () => { sel = 0; desenhar(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel++; desenhar(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel--; desenhar(); e.preventDefault(); }
      if (e.key === 'Enter' && itens[sel]) { e.preventDefault(); e.stopPropagation(); m.fechar(); itens[sel].acao(); }
    });
    const m = G.modal({ titulo: 'Buscar', corpo: h('div', null, inp, res), largura: 620 });
    desenhar();
  };

  // ---------- Atalhos globais ----------
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); G.abrirBusca(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && G.estado.camp) { e.preventDefault(); G.novaPagina(); }
  });

  G.novaPagina = function (tipoSugerido) {
    if (tipoSugerido) { const e = G.estado.criar(tipoSugerido); return G.ir('pagina/' + e.id + '/editar'); }
    G.escolherTipo('Nova página', t => { const e = G.estado.criar(t); G.ir('pagina/' + e.id + '/editar'); });
  };

  // ---------- Topo: busca e dado rápido ----------
  document.addEventListener('DOMContentLoaded', () => {
    G.$('#btn-busca').addEventListener('click', () => G.abrirBusca());
    G.$('#btn-nova').addEventListener('click', () => {
      const r = G.rotaAtual();
      G.novaPagina(r.startsWith('lista/') ? r.split('/')[1] : null);
    });
    G.$('#dado-rapido').addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = G.$('#dado-rapido-expr');
      const out = G.$('#dado-rapido-res');
      try {
        const r = G.dados.rolar(inp.value || '1d20');
        out.innerHTML = `<b class="${r.critico || ''}">${r.total}</b> <small>${G.dados.detalhe(r)}</small>`;
        out.classList.remove('pulso'); void out.offsetWidth; out.classList.add('pulso');
      } catch (err) { out.textContent = err.message; }
    });
  });
})();
