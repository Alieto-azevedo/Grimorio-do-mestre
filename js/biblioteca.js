// Biblioteca: visão geral da campanha e listas por tipo
(function () {
  const { h } = G;

  G.linhaEntidade = function (e, { aoClicar } = {}) {
    const def = G.TIPOS[e.tipo];
    return h('a', {
      href: '#/p/' + e.id, class: 'linha-ent cor-' + def.cor,
      onclick: aoClicar ? (ev) => { ev.preventDefault(); aoClicar(e); } : null
    },
      e.capa ? h('span', { class: 'mini-capa' }, G.imgRef(e.capa)) : h('span', { class: 'mini-capa icone' }, def.icone),
      h('span', { class: 'linha-texto' },
        h('span', { class: 'linha-titulo' }, e.titulo),
        h('span', { class: 'linha-sub' }, def.sub(e) || G.resumoTexto(e.corpo, 70))),
      e.campos && e.campos.atitude ? h('span', { class: 'selo atitude-' + G.normalizar(e.campos.atitude) }, e.campos.atitude) : null);
  };

  G.rota('biblioteca', (alvo, tipo) => {
    if (tipo && G.TIPOS[tipo]) return lista(alvo, tipo);
    const m = G.loja.meta;
    const todas = G.loja.lista();
    const recentes = (m.config.recentes || []).map(G.loja.obter).filter(Boolean).slice(0, 6);
    const titulo = h('input', { class: 'titulo-campanha', value: m.nome, onchange: (e) => { m.nome = e.target.value.trim() || m.nome; G.loja.salvarMeta(); G.emitir('meta'); } });
    alvo.append(
      h('div', { class: 'cab' }, titulo, h('div', { class: 'cab-sub' }, `${m.sistema} · ${todas.length} páginas`)),
      !todas.length ? h('div', { class: 'cartao-aviso' },
        h('p', null, 'A biblioteca está vazia. Traga sua campanha do Notion ou do Grimório antigo, ou comece criando páginas.'),
        h('div', { class: 'linha-botoes' },
          h('button', { class: 'btn primario', onclick: () => G.janelaImportar() }, '⤓ Importar'),
          h('button', { class: 'btn', onclick: () => G.novaPagina() }, '＋ Nova página'))) : null,
      h('div', { class: 'grade-categorias' }, G.ORDEM_TIPOS.map(t => h('a', { href: '#/biblioteca/' + t, class: 'categoria cor-' + G.TIPOS[t].cor },
        h('span', { class: 'cat-icone' }, G.TIPOS[t].icone), h('span', { class: 'cat-nome' }, G.TIPOS[t].plural), h('b', null, todas.filter(e => e.tipo === t).length)))),
      recentes.length ? [h('h2', { class: 'secao' }, 'Abertos recentemente'), h('div', { class: 'lista' }, recentes.map(e => G.linhaEntidade(e)))] : null,
      todas.length ? [h('h2', { class: 'secao' }, 'Editados por último'), h('div', { class: 'lista' }, todas.slice().sort((a, b) => b.editado - a.editado).slice(0, 8).map(e => G.linhaEntidade(e)))] : null,
      h('div', { class: 'linha-botoes rodape-bib' }, h('button', { class: 'btn', onclick: () => G.janelaImportar() }, '⤓ Importar / exportar')));
    G.hidratarImagens(alvo);
    return G.on('entidades', (d) => { if (d && d.remoto) G.renderizar(); });
  });

  function lista(alvo, tipo) {
    const def = G.TIPOS[tipo];
    const campoStatus = def.campos.find(c => c.tipo === 'selecao');
    let q = '', filtroStatus = '', filtroTag = '';
    const corpo = h('div');
    const desenhar = () => {
      let itens = G.loja.lista(tipo);
      const nq = G.normalizar(q);
      if (nq) itens = itens.filter(e => G.normalizar(e.titulo + ' ' + (e.tags || []).join(' ') + ' ' + Object.values(e.campos || {}).join(' ')).includes(nq));
      if (filtroStatus) itens = itens.filter(e => e.campos[campoStatus.id] === filtroStatus);
      if (filtroTag) itens = itens.filter(e => (e.tags || []).includes(filtroTag));
      itens.sort(tipo === 'sessao' ? (a, b) => (+b.campos.numero || 0) - (+a.campos.numero || 0)
        : tipo === 'criatura' ? (a, b) => G.ndNumero(a.ficha && a.ficha.nd) - G.ndNumero(b.ficha && b.ficha.nd) || a.titulo.localeCompare(b.titulo, 'pt-BR')
          : (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
      corpo.innerHTML = '';
      if (!G.loja.lista(tipo).length) {
        corpo.appendChild(h('div', { class: 'vazio' }, h('div', { class: 'vazio-icone' }, def.icone),
          h('p', null, tipo === 'criatura' ? 'Seu bestiário está vazio. Crie uma criatura e cole o statblock dela.' : `Nenhuma página em ${def.plural.toLowerCase()}.`),
          h('button', { class: 'btn primario', onclick: () => G.novaPagina(tipo) }, `＋ ${def.nome}`)));
        return;
      }
      if (tipo === 'missao' && !filtroStatus) {
        for (const st of [...campoStatus.opcoes, '']) {
          const grupo = itens.filter(e => (e.campos.status || '') === st);
          if (grupo.length) corpo.append(h('h2', { class: 'secao' }, st || 'Sem status', h('span', { class: 'contador' }, grupo.length)), h('div', { class: 'lista' }, grupo.map(e => G.linhaEntidade(e))));
        }
      } else corpo.append(h('div', { class: 'lista' }, itens.map(e => G.linhaEntidade(e))));
      if (!itens.length) corpo.appendChild(h('div', { class: 'vazio-p' }, 'Nada com esse filtro.'));
      G.hidratarImagens(corpo);
    };
    const tags = [...new Set(G.loja.lista(tipo).flatMap(e => e.tags || []))].sort();
    alvo.append(
      h('div', { class: 'cab linha' }, h('h1', null, def.icone + ' ' + def.plural, h('span', { class: 'contador' }, G.loja.lista(tipo).length)),
        h('button', { class: 'btn primario', onclick: () => G.novaPagina(tipo) }, '＋ Nova')),
      h('div', { class: 'filtros' },
        h('input', { class: 'campo', type: 'search', placeholder: 'Filtrar…', oninput: (e) => { q = e.target.value; desenhar(); } }),
        campoStatus ? h('select', { class: 'campo', onchange: (e) => { filtroStatus = e.target.value; desenhar(); } },
          h('option', { value: '' }, campoStatus.nome + ': todos'), campoStatus.opcoes.map(o => h('option', { value: o }, o))) : null,
        tags.length ? h('select', { class: 'campo', onchange: (e) => { filtroTag = e.target.value; desenhar(); } },
          h('option', { value: '' }, 'Tags: todas'), tags.map(t => h('option', { value: t }, t))) : null),
      corpo);
    desenhar();
    return G.on('entidades', desenhar);
  }
})();
