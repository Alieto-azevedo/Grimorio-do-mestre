// Listas por tipo e página individual (leitura/edição)
(function () {
  const { h } = G;

  // ---------- Elementos reaproveitáveis ----------
  G.cartaoEntidade = function (e, opcoes = {}) {
    const def = G.TIPOS[e.tipo];
    const capa = e.capa ? G.estado.urlImagem(e.capa) : '';
    const cartao = h('a', {
      href: '#/pagina/' + e.id, class: 'cartao cor-' + def.cor + (opcoes.compacto ? ' compacto' : ''),
      draggable: opcoes.arrastavel ? 'true' : null, dataset: { id: e.id }
    },
      opcoes.compacto ? null : h('div', { class: 'cartao-capa' + (capa ? '' : ' sem-imagem') },
        capa ? h('img', { src: capa, alt: '', loading: 'lazy' }) : h('span', null, def.icone)),
      h('div', { class: 'cartao-corpo' },
        h('div', { class: 'cartao-titulo' }, opcoes.compacto ? def.icone + ' ' : '', e.titulo),
        def.subtitulo(e) ? h('div', { class: 'cartao-sub' }, def.subtitulo(e)) : null,
        opcoes.compacto ? null : h('div', { class: 'cartao-resumo' }, G.resumoTexto(e.corpo, 110)),
        (e.tags && e.tags.length && !opcoes.compacto) ? h('div', { class: 'tags' }, e.tags.slice(0, 4).map(t => h('span', { class: 'tag' }, t))) : null,
        e.campos.atitude ? h('span', { class: 'selo atitude-' + G.normalizar(e.campos.atitude) }, e.campos.atitude) : null
      ));
    return cartao;
  };

  G.renderMarkdown = function (md) {
    return G.md.render(md, {
      resolverLink: (t) => G.estado.porTitulo(t),
      urlImagem: (ref) => (ref.startsWith('img:') || /^(https?:|data:)/.test(ref)) ? G.estado.urlImagem(ref) : ''
    });
  };

  // Transforma expressões de dados do texto (ex.: 1d8+10) em botões roláveis
  G.dadosClicaveis = function (raiz) {
    const re = /\b(\d{0,2}d(?:2|3|4|6|8|10|12|20|100)(?:\s?[+−–-]\s?\d+)?)\b/gi;
    const caminhante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('code, pre, a, .rolavel') || !re.test(n.nodeValue)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nos = [];
    while (caminhante.nextNode()) nos.push(caminhante.currentNode);
    for (const n of nos) {
      const frag = document.createDocumentFragment();
      let ult = 0;
      n.nodeValue.replace(re, (m, _g, idx) => {
        frag.append(n.nodeValue.slice(ult, idx), h('span', { class: 'rolavel', title: 'Clique para rolar', dataset: { expr: m.replace(/\s/g, '').replace(/[−–]/g, '-') } }, m));
        ult = idx + m.length;
      });
      frag.append(n.nodeValue.slice(ult));
      n.replaceWith(frag);
    }
  };
  document.addEventListener('click', (ev) => {
    const r = ev.target.closest('.rolavel');
    if (!r) return;
    const res = G.dados.rolar(r.dataset.expr);
    const bolha = h('div', { class: 'bolha-dado', html: `<b class="${res.critico || ''}">${res.total}</b> <small>${G.esc(res.expr)} ${G.dados.detalhe(res)}</small>` });
    bolha.style.left = ev.clientX + 'px';
    bolha.style.top = ev.clientY - 10 + 'px';
    document.body.appendChild(bolha);
    setTimeout(() => bolha.remove(), 2600);
  });

  // ---------- Lista ----------
  G.rota('lista', (alvo, tipo) => {
    const def = G.TIPOS[tipo];
    if (!def) return G.ir('painel');
    const pref = (G.estado.camp.config.visoes = G.estado.camp.config.visoes || {});
    let visao = pref[tipo] || (tipo === 'missao' ? 'quadro' : 'cartoes');
    let filtro = '';
    let filtroTag = '';
    const campoStatus = def.campos.find(c => c.tipo === 'selecao');
    let filtroStatus = '';

    const corpo = h('div', { class: 'lista-corpo' });
    const desenhar = () => {
      let itens = G.estado.lista(tipo);
      const q = G.normalizar(filtro);
      if (q) itens = itens.filter(e => G.normalizar(e.titulo + ' ' + (e.tags || []).join(' ') + ' ' + Object.values(e.campos).join(' ')).includes(q));
      if (filtroTag) itens = itens.filter(e => (e.tags || []).includes(filtroTag));
      if (filtroStatus && campoStatus) itens = itens.filter(e => e.campos[campoStatus.id] === filtroStatus);
      itens.sort(tipo === 'sessao'
        ? (a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0)
        : (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
      corpo.innerHTML = '';
      if (!G.estado.lista(tipo).length) {
        corpo.appendChild(h('div', { class: 'vazio' },
          h('div', { class: 'vazio-icone' }, def.icone),
          h('p', null, `Nenhuma página de ${def.plural.toLowerCase()} ainda.`),
          h('button', { class: 'btn primario', onclick: () => G.novaPagina(tipo) }, `＋ Criar ${def.nome.toLowerCase()}`)));
        return;
      }
      if (visao === 'tabela') corpo.appendChild(tabela(itens, def));
      else if (visao === 'quadro' && campoStatus) corpo.appendChild(quadro(itens, def, campoStatus, desenhar));
      else corpo.appendChild(h('div', { class: 'grade-cartoes' }, itens.map(e => G.cartaoEntidade(e))));
      if (!itens.length) corpo.appendChild(h('div', { class: 'vazio-pequeno' }, 'Nenhum resultado para esse filtro.'));
    };

    const tags = [...new Set(G.estado.lista(tipo).flatMap(e => e.tags || []))].sort();
    const botaoVisao = (v, rot) => h('button', {
      class: 'seg' + (visao === v ? ' ativo' : ''),
      onclick: (ev) => { visao = pref[tipo] = v; G.estado.salvar(); G.$$('.seg', ev.target.parentNode).forEach(b => b.classList.toggle('ativo', b === ev.target)); desenhar(); }
    }, rot);

    alvo.append(
      h('div', { class: 'cab-pagina' },
        h('h1', null, h('span', { class: 'cab-icone' }, def.icone), def.plural, h('span', { class: 'contador' }, G.estado.lista(tipo).length)),
        h('button', { class: 'btn primario', onclick: () => G.novaPagina(tipo) }, `＋ ${def.nome}`)),
      h('div', { class: 'barra-filtros' },
        h('input', { class: 'campo', placeholder: `Filtrar ${def.plural.toLowerCase()}…`, oninput: (e) => { filtro = e.target.value; desenhar(); } }),
        campoStatus ? h('select', { class: 'campo', onchange: (e) => { filtroStatus = e.target.value; desenhar(); } },
          h('option', { value: '' }, `${campoStatus.nome}: todos`), campoStatus.opcoes.map(o => h('option', { value: o }, o))) : null,
        tags.length ? h('select', { class: 'campo', onchange: (e) => { filtroTag = e.target.value; desenhar(); } },
          h('option', { value: '' }, 'Todas as tags'), tags.map(t => h('option', { value: t }, t))) : null,
        h('div', { class: 'segmentado' },
          botaoVisao('cartoes', '▦ Cartões'), botaoVisao('tabela', '☰ Tabela'),
          campoStatus ? botaoVisao('quadro', '▥ Quadro') : null)),
      corpo);
    desenhar();
    return G.on('entidades', desenhar);
  });

  function valorCampo(e, c) {
    const v = e.campos[c.id];
    if (!v) return '';
    if (c.tipo === 'ref') { const r = G.estado.obter(v); return r ? h('a', { href: '#/pagina/' + r.id, class: 'wiki' }, r.titulo) : ''; }
    if (c.tipo === 'data') return G.dataCurta(v + 'T12:00');
    if (c.tipo === 'url') return h('a', { href: v, target: '_blank', class: 'externo' }, 'abrir');
    return String(v);
  }

  function tabela(itens, def) {
    return h('div', { class: 'tabela-wrap' }, h('table', { class: 'tabela' },
      h('thead', null, h('tr', null, h('th', null, 'Título'), def.campos.map(c => h('th', null, c.nome)), h('th', null, 'Editado'))),
      h('tbody', null, itens.map(e => h('tr', { onclick: (ev) => { if (!ev.target.closest('a')) G.ir('pagina/' + e.id); } },
        h('td', { class: 'td-titulo' }, e.titulo),
        def.campos.map(c => h('td', null, valorCampo(e, c))),
        h('td', { class: 'td-data' }, G.tempoRelativo(e.editado)))))));
  }

  function quadro(itens, def, campo, redesenhar) {
    const colunas = ['', ...campo.opcoes];
    return h('div', { class: 'quadro' }, colunas.map(op => {
      const daColuna = itens.filter(e => (e.campos[campo.id] || '') === op);
      if (!op && !daColuna.length) return null;
      const col = h('div', { class: 'quadro-coluna', dataset: { valor: op } },
        h('div', { class: 'quadro-cab' }, op || 'Sem status', h('span', { class: 'contador' }, daColuna.length)),
        daColuna.map(e => G.cartaoEntidade(e, { compacto: true, arrastavel: true })));
      col.addEventListener('dragover', (ev) => { ev.preventDefault(); col.classList.add('sobre'); });
      col.addEventListener('dragleave', () => col.classList.remove('sobre'));
      col.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const id = ev.dataTransfer.getData('text/grimorio-id');
        const e = G.estado.obter(id);
        if (e) { const campos = Object.assign({}, e.campos, { [campo.id]: op }); G.estado.atualizar(id, { campos }); }
      });
      col.addEventListener('dragstart', (ev) => { const c = ev.target.closest('.cartao'); if (c) ev.dataTransfer.setData('text/grimorio-id', c.dataset.id); });
      return col;
    }));
  }

  // ---------- Página ----------
  G.rota('pagina', (alvo, id, modo) => {
    const e = G.estado.obter(id);
    if (!e) {
      alvo.appendChild(h('div', { class: 'vazio' }, h('p', null, 'Página não encontrada.'), h('a', { href: '#/painel', class: 'btn' }, 'Voltar ao painel')));
      return;
    }
    let editando = modo === 'editar';
    const def = G.TIPOS[e.tipo];
    const recentes = (G.estado.camp.config.recentes = (G.estado.camp.config.recentes || []).filter(x => x !== id && G.estado.obter(x)));
    recentes.unshift(id); recentes.splice(12);

    const salvarCorpo = G.debounce((txt) => G.estado.atualizar(id, { corpo: txt }, { silencioso: true }), 400);
    const pagina = h('article', { class: 'pagina cor-' + def.cor });
    const area = h('div', { class: 'pagina-texto' });

    function desenharCorpo() {
      area.innerHTML = '';
      if (editando) {
        area.appendChild(G.editorMarkdown(e.corpo, (txt) => { e.corpo = txt; salvarCorpo(txt); }));
      } else {
        const conteudo = h('div', { class: 'markdown', html: G.renderMarkdown(e.corpo) });
        if (!e.corpo.trim()) conteudo.appendChild(h('p', { class: 'dica' }, 'Página vazia. Clique em “Editar” (ou Ctrl+E) para escrever.'));
        conteudo.addEventListener('change', (ev) => {
          if (ev.target.matches('input[type=checkbox][data-linha]')) {
            e.corpo = G.md.alternarTarefa(e.corpo, +ev.target.dataset.linha);
            G.estado.atualizar(id, { corpo: e.corpo }, { silencioso: true });
            ev.target.closest('li').classList.toggle('feita', ev.target.checked);
          }
        });
        conteudo.addEventListener('dblclick', (ev) => { if (!ev.target.closest('a, input, .rolavel')) alternarEdicao(); });
        G.dadosClicaveis(conteudo);
        area.appendChild(conteudo);
      }
      btnEditar.textContent = editando ? '✓ Concluir' : '✎ Editar';
      btnEditar.classList.toggle('primario', editando);
    }
    function alternarEdicao() {
      salvarCorpo.agora && salvarCorpo.agora(e.corpo);
      editando = !editando;
      history.replaceState(null, '', '#/pagina/' + id + (editando ? '/editar' : ''));
      desenharCorpo();
      if (editando) setTimeout(() => { const t = G.$('.editor textarea', area); t && t.focus(); }, 20);
    }

    const btnEditar = h('button', { class: 'btn', onclick: alternarEdicao, title: 'Ctrl+E' });
    const podeCombate = ['jogador', 'criatura', 'npc'].includes(e.tipo);

    const titulo = h('input', {
      class: 'titulo-pagina', value: e.titulo, spellcheck: 'true',
      onchange: (ev) => { const t = ev.target.value.trim() || e.titulo; ev.target.value = t; G.estado.atualizar(id, { titulo: t }); },
      onkeydown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); } }
    });

    const capaUrl = e.capa ? G.estado.urlImagem(e.capa) : '';
    const capa = h('div', { class: 'capa' + (capaUrl ? '' : ' sem-capa') },
      capaUrl ? h('img', { src: capaUrl, alt: '' }) : null,
      h('div', { class: 'capa-acoes' },
        h('button', { class: 'btn pequeno', onclick: () => escolherImagem(async (arq) => { const ref = await G.arm.salvarImagem(G.estado.camp.id, arq); G.estado.atualizar(id, { capa: ref }); G.recarregarRota(); }) }, capaUrl ? '🖼 Trocar imagem' : '🖼 Adicionar imagem'),
        capaUrl ? h('button', { class: 'btn pequeno', onclick: () => { G.estado.atualizar(id, { capa: '' }); G.recarregarRota(); } }, 'Remover') : null));

    pagina.append(
      h('div', { class: 'pagina-barra' },
        h('a', { href: '#/lista/' + e.tipo, class: 'migalha' }, def.icone + ' ' + def.plural),
        h('span', { class: 'migalha-sep' }, '›'),
        h('span', { class: 'migalha-atual' }, e.titulo),
        h('div', { class: 'espaco' }),
        podeCombate ? h('button', { class: 'btn', onclick: () => G.enviarAoCombate(e) }, '⚔️ Ao combate') : null,
        h('button', { class: 'btn', onclick: () => { G.porEmCena(id); }, title: 'Fixar na Mesa ao vivo' }, '🕯️ Em cena'),
        btnEditar,
        h('details', { class: 'menu' },
          h('summary', { class: 'btn' }, '⋯'),
          h('div', { class: 'menu-lista' },
            h('button', { onclick: () => { const c = G.estado.duplicar(id); G.ir('pagina/' + c.id); } }, '⧉ Duplicar'),
            h('button', { onclick: () => G.escolherTipo('Mudar tipo da página para…', (t) => { G.estado.atualizar(id, { tipo: t }); G.recarregarRota(); }) }, '⇄ Mudar tipo'),
            h('button', { onclick: () => G.copiar(`[[${e.titulo}]]`) }, '🔗 Copiar link [[ ]]'),
            h('button', { class: 'perigo', onclick: async () => { if (await G.confirmar(`Excluir "${e.titulo}"? Isso não pode ser desfeito.`, 'Excluir')) { G.estado.excluir(id); G.ir('lista/' + e.tipo); } } }, '🗑 Excluir')))),
      capa,
      h('div', { class: 'pagina-cab' },
        h('span', { class: 'selo-tipo cor-' + def.cor }, def.icone + ' ' + def.nome),
        titulo),
      propriedades(e, def),
      tagsEditor(e),
      area,
      relacionados(e),
      mencionadoEm(e)
    );
    alvo.appendChild(pagina);
    desenharCorpo();
    if (e.titulo.endsWith('sem título') && editando) setTimeout(() => { titulo.focus(); titulo.select(); }, 30);

    const atalho = (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'e') { ev.preventDefault(); alternarEdicao(); } };
    document.addEventListener('keydown', atalho);
    return () => { document.removeEventListener('keydown', atalho); salvarCorpo.agora && salvarCorpo.agora(e.corpo); };
  });

  function escolherImagem(cb) {
    const inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    inp.addEventListener('change', () => { if (inp.files[0]) cb(inp.files[0]); inp.remove(); });
    document.body.appendChild(inp);
    inp.click();
  }
  G.escolherImagem = escolherImagem;

  function propriedades(e, def) {
    if (!def.campos.length) return null;
    const salvar = (campo, valor) => {
      const campos = Object.assign({}, e.campos, { [campo]: valor });
      G.estado.atualizar(e.id, { campos }, { silencioso: true });
      e.campos = campos;
    };
    return h('div', { class: 'propriedades' }, def.campos.map(c => {
      let controle;
      const v = e.campos[c.id] ?? '';
      if (c.tipo === 'selecao') {
        controle = h('select', { class: 'prop-valor', onchange: (ev) => salvar(c.id, ev.target.value) },
          h('option', { value: '' }, '—'), c.opcoes.map(o => h('option', { value: o, selected: o === v }, o)));
      } else if (c.tipo === 'ref') {
        const opcoes = G.estado.lista(c.alvo).filter(x => x.id !== e.id).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
        const sel = h('select', { class: 'prop-valor', onchange: (ev) => { salvar(c.id, ev.target.value); ir.style.visibility = ev.target.value ? 'visible' : 'hidden'; } },
          h('option', { value: '' }, '—'), opcoes.map(o => h('option', { value: o.id, selected: o.id === v }, o.titulo)));
        const ir = h('button', { class: 'btn-icone', title: 'Abrir', style: { visibility: v ? 'visible' : 'hidden' }, onclick: () => sel.value && G.ir('pagina/' + sel.value) }, '↗');
        controle = h('div', { class: 'prop-ref' }, sel, ir);
      } else if (c.tipo === 'url') {
        controle = h('div', { class: 'prop-ref' },
          h('input', { class: 'prop-valor', type: 'url', value: v, placeholder: 'https://…', onchange: (ev) => salvar(c.id, ev.target.value.trim()) }),
          v ? h('a', { class: 'btn-icone', href: v, target: '_blank', title: 'Abrir link' }, '↗') : null);
      } else {
        controle = h('input', {
          class: 'prop-valor', type: c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text',
          value: v, placeholder: c.dica || '—', onchange: (ev) => salvar(c.id, ev.target.value)
        });
      }
      return h('label', { class: 'prop' }, h('span', { class: 'prop-nome' }, c.nome), controle);
    }));
  }

  function tagsEditor(e) {
    const caixa = h('div', { class: 'tags tags-editor' });
    const desenhar = () => {
      caixa.innerHTML = '';
      (e.tags || []).forEach(t => caixa.appendChild(h('span', { class: 'tag' }, t,
        h('button', { class: 'tag-x', title: 'Remover tag', onclick: () => { G.estado.atualizar(e.id, { tags: e.tags.filter(x => x !== t) }, { silencioso: true }); desenhar(); } }, '×'))));
      const todas = [...new Set(G.estado.lista().flatMap(x => x.tags || []))];
      const lista = h('datalist', { id: 'dl-tags' }, todas.map(t => h('option', { value: t })));
      caixa.append(h('input', {
        class: 'tag-nova', placeholder: '+ tag', list: 'dl-tags',
        onkeydown: (ev) => {
          if (ev.key === 'Enter' && ev.target.value.trim()) {
            const t = ev.target.value.trim();
            if (!(e.tags || []).includes(t)) G.estado.atualizar(e.id, { tags: [...(e.tags || []), t] }, { silencioso: true });
            desenhar(); setTimeout(() => G.$('.tag-nova', caixa).focus(), 0);
          }
        }
      }), lista);
    };
    desenhar();
    return caixa;
  }

  function secaoCartoes(titulo, itens) {
    if (!itens.length) return null;
    return h('section', { class: 'secao-relacionada' }, h('h3', null, titulo),
      h('div', { class: 'grade-mini' }, itens.map(x => G.cartaoEntidade(x, { compacto: true }))));
  }

  function relacionados(e) {
    const todos = G.estado.lista();
    if (e.tipo === 'faccao') return secaoCartoes('Membros', todos.filter(x => x.campos.faccao === e.id));
    if (e.tipo === 'local') {
      return h('div', null,
        secaoCartoes('Lugares dentro daqui', todos.filter(x => x.campos.regiao === e.id)),
        secaoCartoes('Quem vive aqui', todos.filter(x => x.tipo === 'npc' && x.campos.local === e.id)),
        secaoCartoes('Missões neste local', todos.filter(x => x.tipo === 'missao' && x.campos.local === e.id)));
    }
    if (e.tipo === 'npc') return secaoCartoes('Missões que oferece', todos.filter(x => x.campos.contratante === e.id));
    return null;
  }

  function mencionadoEm(e) {
    const m = G.estado.mencoes(e.id).filter(x => !Object.values(x.campos).includes(e.id) || x.tipo === 'sessao');
    return secaoCartoes('Mencionado em', m);
  }

  // ---------- Editor de Markdown ----------
  G.editorMarkdown = function (textoInicial, aoMudar, opcoes = {}) {
    const ta = h('textarea', { class: 'editor-texto', spellcheck: 'true', placeholder: opcoes.dica || 'Escreva aqui… Use [[ para ligar a outra página, # para títulos, - [ ] para segredos/pistas.' });
    ta.value = textoInicial || '';
    const popup = h('div', { class: 'autocompletar', style: { display: 'none' } });

    const crescer = () => { ta.style.height = 'auto'; ta.style.height = Math.max(opcoes.altura || 320, ta.scrollHeight + 4) + 'px'; };
    const mudou = () => { crescer(); aoMudar(ta.value); };

    function inserir(antes, depois = '', padrao = '') {
      const ini = ta.selectionStart, fim = ta.selectionEnd;
      const sel = ta.value.slice(ini, fim) || padrao;
      ta.setRangeText(antes + sel + depois, ini, fim, 'end');
      if (!ta.value.slice(ini, fim) && padrao) { ta.selectionStart = ini + antes.length; ta.selectionEnd = ini + antes.length + padrao.length; }
      ta.focus(); mudou();
    }
    function prefixoLinha(pref) {
      const ini = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
      ta.setRangeText(pref, ini, ini, 'end');
      ta.focus(); mudou();
    }
    async function inserirImagem(arq) {
      const ref = await G.arm.salvarImagem(G.estado.camp.id, arq);
      inserir(`\n![](${ref})\n`);
    }

    const ferramentas = [
      ['B', 'Negrito (Ctrl+B)', () => inserir('**', '**', 'texto')],
      ['I', 'Itálico (Ctrl+I)', () => inserir('*', '*', 'texto')],
      ['H2', 'Título', () => prefixoLinha('## ')],
      ['H3', 'Subtítulo', () => prefixoLinha('### ')],
      ['•', 'Lista', () => prefixoLinha('- ')],
      ['☐', 'Segredo / pista / tarefa', () => prefixoLinha('- [ ] ')],
      ['❝', 'Citação / fala', () => prefixoLinha('> ')],
      ['[[ ]]', 'Ligar a outra página', () => { inserir('[[', ']]', ''); abrirAuto(); }],
      ['🖼', 'Imagem (também pode colar ou arrastar)', () => escolherImagem(inserirImagem)],
      ['―', 'Divisória', () => inserir('\n---\n')],
      ['▦', 'Tabela', () => inserir('\n| Coluna | Coluna |\n|---|---|\n| | |\n')]
    ];

    ta.addEventListener('input', () => { mudou(); verificarAuto(); });
    ta.addEventListener('keydown', (ev) => {
      if (popup.style.display !== 'none') {
        const itens = G.$$('.auto-item', popup);
        let i = itens.findIndex(x => x.classList.contains('sel'));
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault();
          i = G.limitar(i + (ev.key === 'ArrowDown' ? 1 : -1), 0, itens.length - 1);
          itens.forEach((x, k) => x.classList.toggle('sel', k === i));
          return;
        }
        if ((ev.key === 'Enter' || ev.key === 'Tab') && itens[i]) { ev.preventDefault(); itens[i].dispatchEvent(new Event('mousedown')); return; }
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); popup.style.display = 'none'; return; }
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'b') { ev.preventDefault(); inserir('**', '**', 'texto'); }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'i') { ev.preventDefault(); inserir('*', '*', 'texto'); }
      if (ev.key === 'Enter' && !ev.shiftKey) {
        // Continua listas automaticamente
        const ini = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
        const linha = ta.value.slice(ini, ta.selectionStart);
        const m = linha.match(/^(\s*)([-*+] \[[ xX]\] |[-*+] |\d+\. |> )/);
        if (m) {
          ev.preventDefault();
          if (linha.trim() === m[2].trim()) { ta.setRangeText('', ini, ta.selectionStart, 'end'); mudou(); return; }
          let marcador = m[2].replace(/\[[xX]\]/, '[ ]');
          if (/^\d+\. $/.test(marcador)) marcador = (parseInt(marcador, 10) + 1) + '. ';
          inserir('\n' + m[1] + marcador);
        }
      }
      if (ev.key === 'Tab' && !ev.shiftKey) { ev.preventDefault(); inserir('  '); }
    });
    ta.addEventListener('blur', () => setTimeout(() => { popup.style.display = 'none'; }, 150));
    ta.addEventListener('paste', (ev) => {
      const arq = [...(ev.clipboardData?.files || [])].find(f => f.type.startsWith('image/'));
      if (arq) { ev.preventDefault(); inserirImagem(arq); }
    });
    ta.addEventListener('drop', (ev) => {
      const arq = [...(ev.dataTransfer?.files || [])].find(f => f.type.startsWith('image/'));
      if (arq) { ev.preventDefault(); inserirImagem(arq); }
    });

    // Autocompletar de [[links]]
    function consultaAtual() {
      const antes = ta.value.slice(0, ta.selectionStart);
      const ab = antes.lastIndexOf('[[');
      if (ab < 0 || antes.lastIndexOf(']]') > ab || antes.slice(ab).includes('\n')) return null;
      return { inicio: ab + 2, texto: antes.slice(ab + 2) };
    }
    function abrirAuto() { setTimeout(verificarAuto, 0); }
    function verificarAuto() {
      const c = consultaAtual();
      if (!c) { popup.style.display = 'none'; return; }
      const q = G.normalizar(c.texto);
      const lista = G.estado.lista().filter(x => G.normalizar(x.titulo).includes(q))
        .sort((a, b) => (G.normalizar(a.titulo).startsWith(q) ? 0 : 1) - (G.normalizar(b.titulo).startsWith(q) ? 0 : 1) || b.editado - a.editado)
        .slice(0, 8);
      popup.innerHTML = '';
      const escolher = (titulo) => {
        const depois = ta.value.slice(ta.selectionStart);
        const fechaJa = depois.startsWith(']]');
        ta.setRangeText(titulo + (fechaJa ? '' : ']]'), c.inicio, ta.selectionStart, 'end');
        if (fechaJa) ta.selectionStart = ta.selectionEnd = ta.selectionStart + 2;
        popup.style.display = 'none';
        ta.focus(); mudou();
      };
      lista.forEach((x, i) => popup.appendChild(h('div', { class: 'auto-item' + (i === 0 ? ' sel' : ''), onmousedown: (ev) => { ev.preventDefault(); escolher(x.titulo); } },
        h('span', null, G.TIPOS[x.tipo].icone), ' ', x.titulo)));
      if (c.texto.trim() && !G.estado.porTitulo(c.texto)) {
        popup.appendChild(h('div', { class: 'auto-item' + (lista.length ? '' : ' sel'), onmousedown: (ev) => { ev.preventDefault(); escolher(c.texto.trim()); } }, '＋ ligar a nova página "', c.texto.trim(), '"'));
      }
      if (!popup.children.length) { popup.style.display = 'none'; return; }
      const pos = coordenadasCursor(ta);
      popup.style.left = pos.x + 'px';
      popup.style.top = pos.y + 'px';
      popup.style.display = 'block';
    }

    const barra = h('div', { class: 'editor-barra' }, ferramentas.map(([rot, dica, fn]) =>
      h('button', { type: 'button', class: 'editor-btn', title: dica, onmousedown: (ev) => ev.preventDefault(), onclick: fn }, rot)),
      h('span', { class: 'editor-dica' }, 'Markdown · [[ liga páginas · cole imagens com Ctrl+V'));
    const caixa = h('div', { class: 'editor' }, barra, h('div', { class: 'editor-area' }, ta, popup));
    setTimeout(crescer, 0);
    caixa.textarea = ta;
    return caixa;
  };

  // Posição do cursor dentro do textarea (técnica do "espelho")
  function coordenadasCursor(ta) {
    const estilo = getComputedStyle(ta);
    const espelho = h('div');
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap', 'tabSize']
      .forEach(p => { espelho.style[p] = estilo[p]; });
    Object.assign(espelho.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', wordWrap: 'break-word', width: ta.clientWidth + 'px', top: '0', left: '0' });
    espelho.textContent = ta.value.slice(0, ta.selectionStart);
    const marca = h('span', null, '​');
    espelho.appendChild(marca);
    ta.parentNode.appendChild(espelho);
    const x = marca.offsetLeft, y = marca.offsetTop + parseInt(estilo.lineHeight || '20', 10);
    espelho.remove();
    return { x: Math.min(x, ta.clientWidth - 260), y: y - ta.scrollTop + 4 };
  }
})();
