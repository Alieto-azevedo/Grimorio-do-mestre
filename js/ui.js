// Estrutura da interface: áreas, navegação, folhas (sheets), avisos, busca e visualização rápida
(function () {
  const { h } = G;

  // ---------- Avisos ----------
  G.aviso = function (texto, tipo = 'ok', ms = 2600) {
    const el = h('div', { class: 'aviso ' + tipo }, texto);
    G.$('#avisos').appendChild(el);
    setTimeout(() => el.classList.add('saindo'), ms);
    setTimeout(() => el.remove(), ms + 400);
  };

  G.mostrarRolagem = function (r, rotulo) {
    G.vibrar(20);
    const antigo = G.$('.rolagem-flutuante');
    if (antigo) antigo.remove();
    const el = h('div', { class: 'rolagem-flutuante ' + (r.critico || ''), onclick: () => el.remove() },
      rotulo ? h('div', { class: 'rol-rotulo' }, rotulo) : null,
      h('div', { class: 'rol-total' }, r.total),
      h('div', { class: 'rol-detalhe', html: `${G.esc(r.expr)} → ${G.dados.detalhe(r)}` }),
      r.critico === 'max' ? h('div', { class: 'rol-crit' }, '20 natural!') : r.critico === 'min' ? h('div', { class: 'rol-crit falha' }, '1 natural…') : null);
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('saindo'), 3200);
    setTimeout(() => el.remove(), 3600);
  };

  // ---------- Folhas (no celular sobem de baixo; no PC viram janela) ----------
  G.folha = function ({ titulo, corpo, acoes = [], aoFechar, cheia = false }) {
    const fundo = h('div', { class: 'folha-fundo' });
    const fechar = () => {
      fundo.classList.add('saindo');
      setTimeout(() => fundo.remove(), 180);
      document.removeEventListener('keydown', tecla, true);
      window.removeEventListener('popstate', voltar);
      aoFechar && aoFechar();
    };
    const voltar = () => fechar();
    const tecla = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
      if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        const p = acoes.find(a => a.primario);
        if (p) { e.preventDefault(); e.stopPropagation(); p.acao(fechar); }
      }
    };
    const caixa = h('div', { class: 'folha' + (cheia ? ' cheia' : '') },
      h('div', { class: 'folha-alca' }),
      h('div', { class: 'folha-cab' }, h('h3', null, titulo), h('button', { class: 'btn-icone', onclick: fechar, 'aria-label': 'Fechar' }, '✕')),
      h('div', { class: 'folha-corpo' }, corpo),
      acoes.length ? h('div', { class: 'folha-acoes' }, acoes.map(a =>
        h('button', { class: 'btn ' + (a.primario ? 'primario' : '') + (a.perigo ? ' perigo' : ''), onclick: () => a.acao(fechar) }, a.texto))) : null);
    fundo.appendChild(caixa);
    fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); });
    document.addEventListener('keydown', tecla, true);
    window.addEventListener('popstate', voltar);
    G.$('#camada').appendChild(fundo);
    return { fechar, caixa };
  };

  G.confirmar = (mensagem, ok = 'Confirmar', perigo = true) => new Promise(res => {
    let r = false;
    G.folha({ titulo: 'Confirmar', corpo: h('p', null, mensagem), acoes: [{ texto: 'Cancelar', acao: f => f() }, { texto: ok, primario: true, perigo, acao: f => { r = true; f(); } }], aoFechar: () => res(r) });
  });
  G.perguntar = (titulo, inicial = '', dica = '') => new Promise(res => {
    let r = null;
    const inp = h('input', { class: 'campo largo', value: inicial, placeholder: dica });
    G.folha({ titulo, corpo: inp, acoes: [{ texto: 'Cancelar', acao: f => f() }, { texto: 'OK', primario: true, acao: f => { r = inp.value.trim(); f(); } }], aoFechar: () => res(r) });
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });

  // ---------- Markdown com imagens, dados e caixas clicáveis ----------
  G.renderMarkdown = (md) => G.md.render(md, { resolverLink: (t) => G.loja.porTitulo(t) });

  G.conteudo = function (md, { aoMudarTexto } = {}) {
    const el = h('div', { class: 'markdown', html: G.renderMarkdown(md) });
    G.hidratarImagens(el);
    G.dadosClicaveis(el);
    if (aoMudarTexto) {
      el.addEventListener('change', (ev) => {
        if (ev.target.matches('input[type=checkbox][data-linha]')) {
          aoMudarTexto(G.md.alternarTarefa(md, +ev.target.dataset.linha));
          ev.target.closest('li').classList.toggle('feita', ev.target.checked);
        }
      });
    } else G.$$('input[type=checkbox]', el).forEach(c => { c.disabled = true; });
    return el;
  };

  G.dadosClicaveis = function (raiz) {
    const re = /\b(\d{0,2}d(?:2|3|4|6|8|10|12|20|100)(?:\s?[+−–-]\s?\d+)?)\b/gi;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => { re.lastIndex = 0; return (n.parentElement.closest('code, a, .rolavel, button') || !re.test(n.nodeValue)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    const nos = [];
    while (w.nextNode()) nos.push(w.currentNode);
    for (const n of nos) {
      const frag = document.createDocumentFragment();
      let ult = 0;
      re.lastIndex = 0;
      n.nodeValue.replace(re, (m, _g, idx) => {
        frag.append(n.nodeValue.slice(ult, idx), h('span', { class: 'rolavel', dataset: { expr: m.replace(/\s/g, '').replace(/[−–]/g, '-') } }, m));
        ult = idx + m.length;
      });
      frag.append(n.nodeValue.slice(ult));
      n.replaceWith(frag);
    }
  };
  document.addEventListener('click', (ev) => {
    const r = ev.target.closest('.rolavel');
    if (r) { ev.preventDefault(); G.mostrarRolagem(G.dados.rolar(r.dataset.expr), r.dataset.expr); }
  });

  // Links [[...]]: na Sessão abrem uma visualização rápida (sem sair da mesa); na Biblioteca navegam
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a.wiki');
    if (!a) return;
    ev.preventDefault();
    if (a.dataset.id) {
      if (document.body.dataset.area === 'sessao') G.verRapido(a.dataset.id);
      else G.ir('p/' + a.dataset.id);
      return;
    }
    const titulo = a.dataset.titulo;
    G.escolherTipo(`Criar "${titulo}" como…`, (t) => { const e = G.loja.criar(t, { titulo }); G.ir('p/' + e.id + '/editar'); });
  });

  G.escolherTipo = function (titulo, cb) {
    const f = G.folha({
      titulo, corpo: h('div', { class: 'grade-tipos' }, G.ORDEM_TIPOS.map(t => h('button', { class: 'tipo-botao cor-' + G.TIPOS[t].cor, onclick: () => { f.fechar(); cb(t); } },
        h('span', { class: 'tipo-icone' }, G.TIPOS[t].icone), G.TIPOS[t].nome)))
    });
  };

  // ---------- Visualização rápida (usada na Sessão) ----------
  G.verRapido = function (id) {
    const e = G.loja.obter(id);
    if (!e) return;
    const def = G.TIPOS[e.tipo];
    const corpo = h('div', { class: 'ver-rapido cor-' + def.cor },
      e.capa ? h('div', { class: 'vr-capa' }, G.imgRef(e.capa)) : null,
      h('div', { class: 'vr-sub' }, def.icone + ' ' + def.nome + (def.sub(e) ? ' · ' + def.sub(e) : '')),
      def.ficha && e.ficha ? G.statblock.render(e.ficha, e.titulo) : null,
      G.conteudo(e.corpo, { aoMudarTexto: (txt) => G.loja.atualizar(e.id, { corpo: txt }, { silencioso: true }) }));
    G.hidratarImagens(corpo);
    G.folha({
      titulo: e.titulo, corpo, cheia: true,
      acoes: [
        def.ficha ? { texto: '⚔️ Ao combate', acao: (f) => { G.enviarAoCombate(e); f(); } } : null,
        { texto: '🕯️ Em cena', acao: (f) => { G.porEmCena(e.id); f(); } },
        { texto: '📚 Abrir na Biblioteca', primario: true, acao: (f) => { f(); G.ir('p/' + e.id); } }
      ].filter(Boolean)
    });
  };

  // ---------- Busca ----------
  G.buscar = function ({ titulo = 'Buscar', aoEscolher, filtro, permitirCriar = true } = {}) {
    const inp = h('input', { class: 'campo largo busca', placeholder: 'Nome, tag ou trecho…', type: 'search', autocomplete: 'off' });
    const res = h('div', { class: 'resultados' });
    let f;
    const desenhar = () => {
      const q = G.normalizar(inp.value);
      const itens = G.loja.lista().filter(e => !filtro || filtro(e)).map(e => {
        const t = G.normalizar(e.titulo);
        const pts = !q ? e.editado / 1e13 : t.startsWith(q) ? 3 : t.includes(q) ? 2 : (e.tags || []).some(x => G.normalizar(x).includes(q)) ? 1.5 : (q.length > 2 && G.normalizar(e.corpo).includes(q)) ? 1 : 0;
        return { e, pts };
      }).filter(x => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 30);
      res.innerHTML = '';
      itens.forEach(({ e }) => res.appendChild(h('button', { class: 'resultado', onclick: () => { f.fechar(); aoEscolher(e); } },
        h('span', { class: 'res-icone' }, G.TIPOS[e.tipo].icone), h('span', { class: 'res-titulo' }, e.titulo), h('small', null, G.TIPOS[e.tipo].nome))));
      if (q && permitirCriar && !G.loja.porTitulo(inp.value)) {
        res.appendChild(h('button', { class: 'resultado criar', onclick: () => { f.fechar(); G.escolherTipo('Tipo da nova página', t => { const e = G.loja.criar(t, { titulo: inp.value.trim() }); aoEscolher(e, true); }); } }, '＋ Criar "', inp.value.trim(), '"'));
      }
      if (!res.children.length) res.appendChild(h('div', { class: 'vazio-p' }, 'Nada encontrado.'));
    };
    inp.addEventListener('input', desenhar);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); const b = G.$('.resultado', res); b && b.click(); } });
    f = G.folha({ titulo, corpo: h('div', null, inp, res), cheia: true });
    desenhar();
    setTimeout(() => inp.focus(), 80);
  };

  // ---------- Rotas e áreas ----------
  const rotas = {};
  let limpar = null;
  G.rota = (nome, fn) => { rotas[nome] = fn; };
  G.ir = (c) => { if (location.hash === '#/' + c) G.renderizar(); else location.hash = '#/' + c; };
  G.rotaAtual = () => location.hash.replace(/^#\/?/, '') || 'sessao/mesa';

  const NAV = {
    sessao: [
      ['sessao/mesa', '🕯️', 'Mesa'],
      ['sessao/combate', '⚔️', 'Combate'],
      ['sessao/dados', '🎲', 'Dados'],
      ['sessao/improviso', '✨', 'Improviso'],
      ['buscar', '🔍', 'Consultar']
    ],
    biblioteca: [
      ['biblioteca', '📚', 'Início'],
      ['biblioteca/sessao', '📜', 'Sessões'],
      ['biblioteca/npc', '🎭', 'NPCs'],
      ['biblioteca/criatura', '🐉', 'Bestiário'],
      ['buscar', '🔍', 'Buscar']
    ]
  };

  function areaDaRota(r) { return r.startsWith('sessao') ? 'sessao' : r === 'conta' ? (document.body.dataset.area || 'sessao') : 'biblioteca'; }

  G.renderizar = function () {
    const r = G.rotaAtual();
    if (!G.loja.id && r !== 'conta') { G.ir('conta'); return; }
    const area = areaDaRota(r);
    document.body.dataset.area = area;
    if (r !== 'conta') { try { localStorage.setItem('gm:rota:' + area, r); } catch { /* ignora */ } }
    const alvo = G.$('#conteudo');
    if (limpar) { try { limpar(); } catch { /* ignora */ } limpar = null; }
    alvo.innerHTML = '';
    window.scrollTo(0, 0);
    const [nome, ...params] = r.split('/').map(decodeURIComponent);
    const fn = rotas[nome] || rotas.sessao;
    const res = fn(alvo, ...params);
    if (typeof res === 'function') limpar = res;
    desenharCasca(area, r);
  };
  window.addEventListener('hashchange', G.renderizar);

  function desenharCasca(area, r) {
    const topo = G.$('#topo');
    const m = G.loja.meta;
    topo.innerHTML = '';
    topo.append(
      h('div', { class: 'seletor-area' },
        h('button', { class: 'area-btn' + (area === 'sessao' ? ' ativo' : ''), onclick: () => G.ir(lembrarRota('sessao', 'sessao/mesa')) }, '⚔️ ', h('span', null, 'Sessão')),
        h('button', { class: 'area-btn' + (area === 'biblioteca' ? ' ativo' : ''), onclick: () => G.ir(lembrarRota('biblioteca', 'biblioteca')) }, '📚 ', h('span', null, 'Biblioteca'))),
      h('button', { class: 'camp-nome', onclick: () => G.ir('conta'), title: 'Campanhas e conta' },
        h('span', { class: 'sinc', id: 'sinc', title: 'Sincronização' }), m ? m.nome : 'Grimório'),
      area === 'biblioteca' ? h('button', { class: 'btn-icone grande', title: 'Nova página', onclick: () => G.novaPagina() }, '＋') : null);
    const itens = NAV[area];
    const nav = () => itens.map(([rota, ic, txt]) => h('a', {
      href: rota === 'buscar' ? '#' : '#/' + rota,
      class: 'aba' + (r === rota || (rota !== 'biblioteca' && r.startsWith(rota + '/')) ? ' ativo' : ''),
      onclick: rota === 'buscar' ? (ev) => { ev.preventDefault(); area === 'sessao' ? G.buscar({ titulo: 'Consultar', aoEscolher: (e) => G.verRapido(e.id), permitirCriar: false }) : G.buscar({ aoEscolher: (e, nova) => G.ir('p/' + e.id + (nova ? '/editar' : '')) }); } : null
    }, h('span', { class: 'aba-icone' }, ic), h('span', { class: 'aba-texto' }, txt)));
    G.$('#abas').innerHTML = ''; G.$('#abas').append(nav());
    G.$('#trilho').innerHTML = '';
    G.$('#trilho').append(nav(), area === 'biblioteca' ? [h('div', { class: 'trilho-sep' }), G.ORDEM_TIPOS.filter(t => !['sessao', 'npc', 'criatura'].includes(t)).map(t =>
      h('a', { href: '#/biblioteca/' + t, class: 'aba' + (r === 'biblioteca/' + t ? ' ativo' : '') }, h('span', { class: 'aba-icone' }, G.TIPOS[t].icone), h('span', { class: 'aba-texto' }, G.TIPOS[t].plural)))] : null);
    atualizarSinc(ultimoStatus);
  }
  function lembrarRota(area, padrao) { try { return localStorage.getItem('gm:rota:' + area) || padrao; } catch { return padrao; } }

  let ultimoStatus = 'ok';
  function atualizarSinc(s) {
    ultimoStatus = s;
    const el = G.$('#sinc');
    if (!el) return;
    el.className = 'sinc ' + (G.arm && G.arm.tipo === 'local' ? 'local' : s);
    el.title = G.arm && G.arm.tipo === 'local' ? 'Modo local (sem sincronização)' : s === 'ok' ? 'Sincronizado' : s === 'pendente' ? 'Enviando alterações…' : 'Offline — as alterações sobem quando a internet voltar';
  }
  G.on('sinc', atualizarSinc);
  window.addEventListener('offline', () => atualizarSinc('offline'));
  G.on('meta', () => { const n = G.$('.camp-nome'); if (n && G.loja.meta) n.lastChild.textContent = G.loja.meta.nome; });

  G.novaPagina = function (tipo) {
    if (tipo) { const e = G.loja.criar(tipo); return G.ir('p/' + e.id + '/editar'); }
    G.escolherTipo('Nova página', t => { const e = G.loja.criar(t); G.ir('p/' + e.id + '/editar'); });
  };

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && G.loja.id) {
      e.preventDefault();
      if (document.body.dataset.area === 'sessao') G.buscar({ titulo: 'Consultar', aoEscolher: (x) => G.verRapido(x.id), permitirCriar: false });
      else G.buscar({ aoEscolher: (x, nova) => G.ir('p/' + x.id + (nova ? '/editar' : '')) });
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && G.loja.id) G.loja.salvarTudoAgora(); });
})();
