// Página da Biblioteca: leitura, propriedades, ficha de combate e editor
(function () {
  const { h } = G;

  const CAMPOS_FICHA = [
    ['nd', 'ND'], ['xp', 'XP'], ['ca', 'CA'], ['toque', 'Toque'], ['surpreso', 'Surpreso'], ['pv', 'PV'], ['dv', 'Dados de vida'],
    ['ini', 'Iniciativa'], ['percepcao', 'Percepção'], ['fort', 'Fort'], ['ref', 'Ref'], ['von', 'Von'], ['desloc', 'Deslocamento', 'largo'],
    ['cac', 'Corpo a corpo', 'largo'], ['dist', 'À distância', 'largo'], ['especial', 'Ataques especiais', 'largo'], ['defesas', 'Defesas', 'largo'],
    ['atributos', 'For/Des/Con/Int/Sab/Car', 'largo'], ['cmb', 'BMC'], ['cmd', 'DMC']
  ];

  G.rota('p', (alvo, id, modo) => {
    const e = G.loja.obter(id);
    if (!e) { alvo.appendChild(h('div', { class: 'vazio' }, h('p', null, 'Página não encontrada.'), h('a', { class: 'btn', href: '#/biblioteca' }, 'Voltar'))); return; }
    const def = G.TIPOS[e.tipo];
    const m = G.loja.meta;
    m.config.recentes = [id, ...(m.config.recentes || []).filter(x => x !== id)].slice(0, 12);
    G.loja.salvarMeta();
    let editando = modo === 'editar';

    const area = h('div', { class: 'pagina-texto' });
    const salvarTexto = G.debounce((t) => G.loja.atualizar(id, { corpo: t }, { silencioso: true }), 500);

    function desenharTexto() {
      area.innerHTML = '';
      if (editando) {
        area.appendChild(G.editor(e.corpo, (t) => { e.corpo = t; salvarTexto(t); }));
        btnEditar.textContent = '✓ Pronto';
        btnEditar.classList.add('primario');
      } else {
        const c = G.conteudo(e.corpo, { aoMudarTexto: (t) => { e.corpo = t; G.loja.atualizar(id, { corpo: t }, { silencioso: true }); } });
        if (!e.corpo.trim()) c.appendChild(h('p', { class: 'dica' }, 'Sem texto ainda. Toque em “Editar texto”.'));
        area.appendChild(c);
        btnEditar.textContent = '✎ Editar texto';
        btnEditar.classList.remove('primario');
      }
    }
    const btnEditar = h('button', { class: 'btn', onclick: () => { salvarTexto.agora(); editando = !editando; history.replaceState(null, '', '#/p/' + id + (editando ? '/editar' : '')); desenharTexto(); } });

    const titulo = h('textarea', {
      class: 'titulo-pagina', rows: 1,
      onchange: (ev) => { const t = ev.target.value.trim().replace(/\n/g, ' ') || e.titulo; ev.target.value = t; G.loja.atualizar(id, { titulo: t }, { silencioso: true }); },
      oninput: (ev) => { ev.target.style.height = 'auto'; ev.target.style.height = ev.target.scrollHeight + 'px'; },
      onkeydown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); } }
    });
    titulo.value = e.titulo;

    const capa = h('div', { class: 'capa' + (e.capa ? '' : ' vazia') },
      e.capa ? G.imgRef(e.capa) : null,
      h('button', {
        class: 'btn pequeno capa-btn', onclick: async () => {
          const arq = await G.escolherArquivo('image/*');
          if (!arq) return;
          G.aviso('Enviando imagem…', 'info');
          const ref = await G.loja.salvarImagem(arq);
          G.loja.atualizar(id, { capa: ref }, { silencioso: true });
          G.renderizar();
        }
      }, e.capa ? '🖼 Trocar' : '🖼 Imagem'),
      e.capa ? h('button', { class: 'btn pequeno capa-btn2', onclick: () => { G.loja.atualizar(id, { capa: '' }, { silencioso: true }); G.renderizar(); } }, 'Remover') : null);

    const menu = h('details', { class: 'menu' }, h('summary', { class: 'btn-icone grande' }, '⋯'),
      h('div', { class: 'menu-lista' },
        h('button', { onclick: () => { G.porEmCena(id); fecharMenu(); } }, '🕯️ Pôr em cena (Sessão)'),
        def.ficha ? h('button', { onclick: () => { G.enviarAoCombate(e); fecharMenu(); } }, '⚔️ Mandar ao combate') : null,
        h('button', { onclick: () => { const c = G.loja.duplicar(id); G.ir('p/' + c.id); } }, '⧉ Duplicar'),
        h('button', { onclick: () => { fecharMenu(); G.escolherTipo('Mudar tipo para…', (t) => { G.loja.atualizar(id, { tipo: t }); G.renderizar(); }); } }, '⇄ Mudar tipo'),
        h('button', { onclick: () => { G.copiar(`[[${e.titulo}]]`); fecharMenu(); } }, '🔗 Copiar link [[ ]]'),
        h('button', { class: 'perigo', onclick: async () => { fecharMenu(); if (await G.confirmar(`Excluir "${e.titulo}"?`, 'Excluir')) { G.loja.excluir(id); G.ir('biblioteca/' + e.tipo); } } }, '🗑 Excluir')));
    const fecharMenu = () => menu.removeAttribute('open');

    alvo.append(
      h('div', { class: 'pagina-barra' },
        h('a', { class: 'voltar', href: '#/biblioteca/' + e.tipo }, '‹ ' + def.plural),
        h('div', { class: 'espaco' }), btnEditar, menu),
      h('article', { class: 'pagina cor-' + def.cor },
        capa,
        h('span', { class: 'selo-tipo' }, def.icone + ' ' + def.nome),
        titulo,
        propriedades(e, def),
        tagsEditor(e),
        def.ficha ? secaoFicha(e) : null,
        area,
        relacionados(e)));
    desenharTexto();
    G.hidratarImagens(alvo);
    setTimeout(() => titulo.dispatchEvent(new Event('input')), 0);
    if (editando && / sem título$/.test(e.titulo)) setTimeout(() => { titulo.focus(); titulo.select(); }, 60);
    return () => salvarTexto.agora();
  });

  function propriedades(e, def) {
    if (!def.campos.length) return null;
    const salvar = (c, v) => { e.campos = Object.assign({}, e.campos, { [c]: v }); G.loja.atualizar(e.id, { campos: e.campos }, { silencioso: true }); };
    return h('div', { class: 'props' }, def.campos.map(c => {
      const v = e.campos[c.id] ?? '';
      let ctl;
      if (c.tipo === 'selecao') ctl = h('select', { onchange: (ev) => salvar(c.id, ev.target.value) }, h('option', { value: '' }, '—'), c.opcoes.map(o => h('option', { value: o, selected: o === v }, o)));
      else if (c.tipo === 'ref') {
        const ops = G.loja.lista(c.alvo).filter(x => x.id !== e.id).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
        const alvoEnt = G.loja.obter(v);
        ctl = h('div', { class: 'prop-ref' },
          h('select', { onchange: (ev) => { salvar(c.id, ev.target.value); G.renderizar(); } }, h('option', { value: '' }, '—'), ops.map(o => h('option', { value: o.id, selected: o.id === v }, o.titulo))),
          alvoEnt ? h('a', { class: 'ir', href: '#/p/' + alvoEnt.id }, '↗') : null);
      } else if (c.tipo === 'url') ctl = h('div', { class: 'prop-ref' }, h('input', { type: 'url', value: v, placeholder: 'https://…', onchange: (ev) => salvar(c.id, ev.target.value.trim()) }), v ? h('a', { class: 'ir', href: v, target: '_blank', rel: 'noopener' }, '↗') : null);
      else ctl = h('input', { type: c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text', inputmode: c.tipo === 'numero' ? 'numeric' : null, value: v, placeholder: c.dica || '—', onchange: (ev) => salvar(c.id, ev.target.value) });
      return h('label', { class: 'prop' }, h('span', null, c.nome), ctl);
    }));
  }

  function tagsEditor(e) {
    const caixa = h('div', { class: 'tags' });
    const desenhar = () => {
      caixa.innerHTML = '';
      (e.tags || []).forEach(t => caixa.appendChild(h('span', { class: 'tag' }, t, h('button', { onclick: () => { e.tags = e.tags.filter(x => x !== t); G.loja.atualizar(e.id, { tags: e.tags }, { silencioso: true }); desenhar(); } }, '×'))));
      caixa.appendChild(h('input', {
        class: 'tag-nova', placeholder: '+ tag', enterkeyhint: 'done',
        onkeydown: (ev) => { if (ev.key === 'Enter' && ev.target.value.trim()) { ev.preventDefault(); const t = ev.target.value.trim(); if (!(e.tags || []).includes(t)) { e.tags = [...(e.tags || []), t]; G.loja.atualizar(e.id, { tags: e.tags }, { silencioso: true }); } desenhar(); G.$('.tag-nova', caixa).focus(); } }
      }));
    };
    desenhar();
    return caixa;
  }

  // ---------- Ficha de combate ----------
  function secaoFicha(e) {
    const sec = h('section', { class: 'secao-ficha' });
    const desenhar = () => {
      sec.innerHTML = '';
      sec.append(
        h('div', { class: 'secao-cab' }, h('h2', null, '⚔️ Ficha de combate'),
          h('button', { class: 'btn pequeno', onclick: () => colarStatblock(e, desenhar) }, '📋 Colar statblock'),
          h('button', { class: 'btn pequeno', onclick: () => editarFicha(e, desenhar) }, '✎')),
        e.ficha ? G.statblock.render(e.ficha, e.titulo) : h('p', { class: 'dica' }, 'Cole o statblock (d20pfsrd, Archives of Nethys ou do seu Notion) e o app preenche CA, PV, iniciativa, salvaguardas e ataques com botões de rolagem.'));
    };
    desenhar();
    return sec;
  }

  function colarStatblock(e, aoMudar) {
    const ta = h('textarea', { class: 'campo largo', rows: 9, placeholder: 'Cole aqui o statblock completo…' });
    const previa = h('div', { class: 'previa-ficha' });
    let lido = null;
    ta.addEventListener('input', G.debounce(() => {
      lido = ta.value.trim() ? G.statblock.ler(ta.value) : null;
      previa.innerHTML = '';
      if (lido) previa.append(h('div', { class: 'dica' }, 'Prévia:', lido.nome ? ` ${lido.nome}` : ''), G.statblock.render(lido, lido.nome));
    }, 250));
    G.folha({
      titulo: 'Colar statblock', cheia: true, corpo: h('div', null, ta, previa),
      acoes: [{ texto: 'Cancelar', acao: f => f() }, {
        texto: 'Usar esta ficha', primario: true, acao: (f) => {
          if (!lido) return G.aviso('Cole um statblock primeiro', 'erro');
          const mudancas = { ficha: Object.fromEntries(Object.entries(lido).filter(([k]) => k !== 'nome')) };
          if (lido.nome && / sem título$/.test(e.titulo)) mudancas.titulo = lido.nome;
          G.loja.atualizar(e.id, mudancas);
          f();
          if (mudancas.titulo) G.renderizar(); else aoMudar();
        }
      }]
    });
    setTimeout(() => ta.focus(), 80);
  }

  function editarFicha(e, aoMudar) {
    const f0 = Object.assign({}, e.ficha || {});
    const corpo = h('div', { class: 'form-ficha' }, CAMPOS_FICHA.map(([k, rot, cls]) =>
      h('label', { class: 'prop-ficha ' + (cls || '') }, h('span', null, rot),
        h('input', { value: f0[k] || '', inputmode: /^(ca|toque|surpreso|pv|ini|percepcao|fort|ref|von|xp|cmb|cmd)$/.test(k) ? 'numeric' : null, oninput: (ev) => { f0[k] = ev.target.value.trim(); } }))));
    G.folha({
      titulo: 'Ficha de combate', cheia: true, corpo,
      acoes: [
        e.ficha ? { texto: 'Apagar ficha', perigo: true, acao: (f) => { G.loja.atualizar(e.id, { ficha: null }); f(); aoMudar(); } } : null,
        { texto: 'Salvar', primario: true, acao: (f) => { if (f0.nd && !f0.xp && G.XP_POR_ND[f0.nd]) f0.xp = String(G.XP_POR_ND[f0.nd]); G.loja.atualizar(e.id, { ficha: f0 }); f(); aoMudar(); } }
      ].filter(Boolean)
    });
  }

  function relacionados(e) {
    const todos = G.loja.lista();
    const bloco = (t, itens) => itens.length ? h('section', { class: 'relacionados' }, h('h3', null, t), h('div', { class: 'lista' }, itens.map(x => G.linhaEntidade(x)))) : null;
    const porCampo = (campo) => todos.filter(x => x.campos && x.campos[campo] === e.id);
    const extra = e.tipo === 'faccao' ? bloco('Membros', porCampo('faccao'))
      : e.tipo === 'local' ? [bloco('Lugares aqui dentro', porCampo('regiao')), bloco('Quem vive aqui', todos.filter(x => x.tipo === 'npc' && x.campos.local === e.id)), bloco('Missões aqui', todos.filter(x => x.tipo === 'missao' && x.campos.local === e.id))]
        : e.tipo === 'npc' ? bloco('Missões que oferece', porCampo('contratante')) : null;
    const ja = new Set(todos.filter(x => Object.values(x.campos || {}).includes(e.id)).map(x => x.id));
    const mencoes = G.loja.mencoes(e.id).filter(x => !ja.has(x.id));
    const div = h('div', null, extra, bloco('Mencionado em', mencoes));
    setTimeout(() => G.hidratarImagens(div), 0);
    return div;
  }

  // ---------- Editor de texto (pensado para toque) ----------
  G.editor = function (inicial, aoMudar) {
    const ta = h('textarea', { class: 'editor-texto', spellcheck: 'true', placeholder: 'Escreva… [[ liga páginas · # título · - [ ] segredo/pista' });
    ta.value = inicial || '';
    const sugestoes = h('div', { class: 'sugestoes-link' });
    const crescer = () => { ta.style.height = 'auto'; ta.style.height = Math.max(260, ta.scrollHeight + 4) + 'px'; };
    const mudou = () => { crescer(); aoMudar(ta.value); };
    const inserir = (antes, depois = '', padrao = '') => {
      const i = ta.selectionStart, f = ta.selectionEnd;
      const sel = ta.value.slice(i, f) || padrao;
      ta.setRangeText(antes + sel + depois, i, f, 'end');
      if (i === f && padrao) { ta.selectionStart = i + antes.length; ta.selectionEnd = i + antes.length + padrao.length; }
      ta.focus(); mudou(); verificar();
    };
    const prefixo = (p) => { const i = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1; ta.setRangeText(p, i, i, 'end'); ta.focus(); mudou(); };

    function consulta() {
      const antes = ta.value.slice(0, ta.selectionStart);
      const a = antes.lastIndexOf('[[');
      if (a < 0 || antes.lastIndexOf(']]') > a || antes.slice(a).includes('\n')) return null;
      return { inicio: a + 2, texto: antes.slice(a + 2) };
    }
    function verificar() {
      const c = consulta();
      sugestoes.innerHTML = '';
      if (!c) { sugestoes.classList.remove('ativo'); return; }
      const q = G.normalizar(c.texto);
      const lista = G.loja.lista().filter(x => G.normalizar(x.titulo).includes(q))
        .sort((a, b) => (G.normalizar(a.titulo).startsWith(q) ? 0 : 1) - (G.normalizar(b.titulo).startsWith(q) ? 0 : 1) || b.editado - a.editado).slice(0, 8);
      const escolher = (t) => {
        const fecha = ta.value.slice(ta.selectionStart).startsWith(']]');
        ta.setRangeText(t + (fecha ? '' : ']]'), c.inicio, ta.selectionStart, 'end');
        if (fecha) ta.selectionStart = ta.selectionEnd = ta.selectionStart + 2;
        ta.focus(); mudou(); verificar();
      };
      lista.forEach(x => sugestoes.appendChild(h('button', { type: 'button', onmousedown: (ev) => ev.preventDefault(), onclick: () => escolher(x.titulo) }, G.TIPOS[x.tipo].icone + ' ' + x.titulo)));
      if (c.texto.trim() && !G.loja.porTitulo(c.texto)) sugestoes.appendChild(h('button', { type: 'button', class: 'nova', onmousedown: (ev) => ev.preventDefault(), onclick: () => escolher(c.texto.trim()) }, '＋ "' + c.texto.trim() + '"'));
      sugestoes.classList.toggle('ativo', !!sugestoes.children.length);
    }

    ta.addEventListener('input', () => { mudou(); verificar(); });
    ta.addEventListener('click', verificar);
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey && sugestoes.classList.contains('ativo')) { const b = G.$('button', sugestoes); if (b) { ev.preventDefault(); b.click(); return; } }
      if (ev.key === 'Enter' && !ev.shiftKey) {
        const i = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
        const linha = ta.value.slice(i, ta.selectionStart);
        const m = linha.match(/^(\s*)([-*+] \[[ xX]\] |[-*+] |\d+\. |> )/);
        if (m) {
          ev.preventDefault();
          if (linha.trim() === m[2].trim()) { ta.setRangeText('', i, ta.selectionStart, 'end'); mudou(); return; }
          let mk = m[2].replace(/\[[xX]\]/, '[ ]');
          if (/^\d+\. $/.test(mk)) mk = (parseInt(mk, 10) + 1) + '. ';
          inserir('\n' + m[1] + mk);
        }
      }
    });
    const inserirImagem = async (arq) => { G.aviso('Enviando imagem…', 'info'); const ref = await G.loja.salvarImagem(arq); inserir(`\n![](${ref})\n`); };
    ta.addEventListener('paste', (ev) => { const a = [...(ev.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (a) { ev.preventDefault(); inserirImagem(a); } });

    const b = (rot, dica, fn) => h('button', { type: 'button', class: 'ed-btn', title: dica, onmousedown: (ev) => ev.preventDefault(), onclick: fn }, rot);
    const barra = h('div', { class: 'editor-barra' },
      b('H2', 'Título', () => prefixo('## ')), b('H3', 'Subtítulo', () => prefixo('### ')),
      b('B', 'Negrito', () => inserir('**', '**', 'texto')), b('I', 'Itálico', () => inserir('*', '*', 'texto')),
      b('•', 'Lista', () => prefixo('- ')), b('☐', 'Segredo/pista', () => prefixo('- [ ] ')), b('❝', 'Fala/citação', () => prefixo('> ')),
      b('[[ ]]', 'Ligar página', () => inserir('[[', ']]', '')), b('🖼', 'Imagem', async () => { const a = await G.escolherArquivo('image/*'); if (a) inserirImagem(a); }),
      b('🎲', 'Dado', () => inserir('1d20+', '', '0')));
    const caixa = h('div', { class: 'editor' }, barra, sugestoes, ta);
    setTimeout(crescer, 0);
    return caixa;
  };
})();
