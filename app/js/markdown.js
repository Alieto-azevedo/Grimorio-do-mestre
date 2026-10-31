// Renderizador de Markdown do Grimório (subconjunto + [[links internos]] + caixas de seleção clicáveis)
G.md = (function () {
  const esc = G.esc;

  function inline(texto, op) {
    let s = esc(texto);
    const guardados = [];
    const guardar = (html) => `\u0000${guardados.push(html) - 1}\u0000`;

    s = s.replace(/`([^`]+)`/g, (_, c) => guardar(`<code>${c}</code>`));
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
      const url = op.urlImagem ? op.urlImagem(src) : src;
      if (!url) return '';
      return guardar(`<img src="${url}" alt="${alt}" loading="lazy" class="img-inline">`);
    });
    s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, titulo, apelido) => {
      const alvo = op.resolverLink ? op.resolverLink(titulo.trim()) : null;
      const cls = alvo ? `wiki tipo-${alvo.tipo}` : 'wiki quebrado';
      const dados = alvo ? `data-id="${alvo.id}"` : `data-titulo="${esc(titulo.trim())}"`;
      return guardar(`<a href="#" class="${cls}" ${dados} title="${alvo ? '' : 'Página ainda não existe — clique para criar'}">${apelido || titulo}</a>`);
    });
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+|mailto:[^)\s]+)\)/g, (_, t, url) =>
      guardar(`<a href="${url}" class="externo" target="_blank" rel="noopener">${t}</a>`));
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, url) =>
      pre + guardar(`<a href="${url}" class="externo" target="_blank" rel="noopener">${url.length > 50 ? url.slice(0, 47) + '…' : url}</a>`));
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[+i]);
  }

  function render(md, op = {}) {
    const linhas = String(md || '').replace(/\r\n/g, '\n').split('\n');
    return blocos(linhas, 0, op);
  }

  // base = deslocamento das linhas (para caixas de seleção apontarem para a linha certa do texto original)
  function blocos(linhas, base, op) {
    let html = '';
    let i = 0;
    const RE_LISTA = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

    while (i < linhas.length) {
      const l = linhas[i];
      const t = l.trim();
      if (!t) { i++; continue; }

      if (t.startsWith('```')) {
        const cod = [];
        i++;
        while (i < linhas.length && !linhas[i].trim().startsWith('```')) cod.push(linhas[i++]);
        i++;
        html += `<pre><code>${esc(cod.join('\n'))}</code></pre>`;
        continue;
      }
      const cab = t.match(/^(#{1,6})\s+(.*)$/);
      if (cab) {
        const n = Math.min(cab[1].length + 1, 6);
        html += `<h${n}>${inline(cab[2], op)}</h${n}>`;
        i++; continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { html += '<hr>'; i++; continue; }

      if (t.startsWith('>')) {
        const ini = i; const dentro = [];
        while (i < linhas.length && linhas[i].trim().startsWith('>')) dentro.push(linhas[i++].trim().replace(/^>\s?/, ''));
        html += `<blockquote>${blocos(dentro, base + ini, op)}</blockquote>`;
        continue;
      }

      if (t.startsWith('|') && linhas[i + 1] && /^\s*\|?\s*:?-{2,}/.test(linhas[i + 1])) {
        const celulas = (s) => s.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const cabec = celulas(t);
        i += 2;
        let corpo = '';
        while (i < linhas.length && linhas[i].trim().startsWith('|')) {
          corpo += '<tr>' + celulas(linhas[i++]).map(c => `<td>${inline(c, op)}</td>`).join('') + '</tr>';
        }
        html += `<div class="tabela-md"><table><thead><tr>${cabec.map(c => `<th>${inline(c, op)}</th>`).join('')}</tr></thead><tbody>${corpo}</tbody></table></div>`;
        continue;
      }

      if (RE_LISTA.test(l)) {
        const itens = [];
        while (i < linhas.length && (RE_LISTA.test(linhas[i]) || (linhas[i].trim() && /^\s{2,}/.test(linhas[i]) && itens.length))) {
          const m = linhas[i].match(RE_LISTA);
          if (m) itens.push({ nivel: Math.floor(m[1].replace(/\t/g, '  ').length / 2), ordenada: /\d/.test(m[2]), texto: m[3], linha: base + i });
          else itens[itens.length - 1].texto += ' ' + linhas[i].trim();
          i++;
        }
        html += lista(itens, 0, op).html;
        continue;
      }

      const soImagem = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (soImagem) {
        const url = op.urlImagem ? op.urlImagem(soImagem[2]) : soImagem[2];
        if (url) html += `<figure><img src="${url}" alt="${esc(soImagem[1])}" loading="lazy">${soImagem[1] ? `<figcaption>${inline(soImagem[1], op)}</figcaption>` : ''}</figure>`;
        i++; continue;
      }

      const par = [];
      while (i < linhas.length && linhas[i].trim() && !/^(#{1,6}\s|```|>|\||(-{3,}|\*{3,})$)/.test(linhas[i].trim()) && !RE_LISTA.test(linhas[i]) && !/^!\[[^\]]*\]\([^)]+\)$/.test(linhas[i].trim())) {
        par.push(inline(linhas[i++].trim(), op));
      }
      if (par.length) html += `<p>${par.join('<br>')}</p>`;
      else i++;
    }
    return html;
  }

  function lista(itens, ini, op) {
    const nivel = itens[ini].nivel;
    const ordenada = itens[ini].ordenada;
    let html = ordenada ? '<ol>' : '<ul>';
    let i = ini;
    while (i < itens.length && itens[i].nivel >= nivel) {
      const it = itens[i];
      if (it.nivel > nivel) { const sub = lista(itens, i, op); html = html.replace(/<\/li>$/, sub.html + '</li>'); i = sub.fim; continue; }
      const cb = it.texto.match(/^\[([ xX])\]\s*(.*)$/);
      if (cb) {
        const marcado = cb[1] !== ' ';
        html += `<li class="tarefa${marcado ? ' feita' : ''}"><label><input type="checkbox" data-linha="${it.linha}"${marcado ? ' checked' : ''}> <span>${inline(cb[2], op)}</span></label></li>`;
      } else html += `<li>${inline(it.texto, op)}</li>`;
      i++;
    }
    html += ordenada ? '</ol>' : '</ul>';
    return { html, fim: i };
  }

  // Alterna "- [ ]" <-> "- [x]" numa linha do texto original
  function alternarTarefa(md, linha) {
    const linhas = String(md).split('\n');
    if (linhas[linha] !== undefined) {
      linhas[linha] = /\[[xX]\]/.test(linhas[linha]) ? linhas[linha].replace(/\[[xX]\]/, '[ ]') : linhas[linha].replace(/\[ \]/, '[x]');
    }
    return linhas.join('\n');
  }

  // Lista de [[links]] citados num texto
  function links(md) {
    const s = new Set();
    String(md || '').replace(/\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g, (_, t) => s.add(t.trim()));
    return [...s];
  }

  // Tarefas (segredos, pistas…) do texto, com nº da linha
  function tarefas(md) {
    return String(md || '').split('\n').map((l, i) => {
      const m = l.match(/^\s*[-*+]\s+\[([ xX])\]\s*(.*)$/);
      return m ? { linha: i, feita: m[1] !== ' ', texto: m[2] } : null;
    }).filter(x => x && x.texto.trim());
  }

  return { render, inline, alternarTarefa, links, tarefas };
})();
