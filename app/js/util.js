// Utilidades gerais do Grimório
window.G = window.G || {};

G.$ = (sel, raiz = document) => raiz.querySelector(sel);
G.$$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

// Cria elementos: G.h('div', {class:'x', onclick: fn}, 'texto', outroNo, [lista])
G.h = function (tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  const adicionar = (f) => {
    if (f === null || f === undefined || f === false) return;
    if (Array.isArray(f)) return f.forEach(adicionar);
    el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
  };
  filhos.forEach(adicionar);
  return el;
};

G.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
G.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
G.limitar = (n, min, max) => Math.max(min, Math.min(max, n));
G.normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
G.aleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];

G.debounce = function (fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.agora = (...a) => { clearTimeout(t); return fn(...a); };
  return d;
};

G.dataCurta = (ts) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '';
G.dataHora = (ts) => ts ? new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
G.horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
G.tempoRelativo = function (ts) {
  if (!ts) return '';
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'agora mesmo';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `há ${Math.floor(s / 86400)} dias`;
  return G.dataCurta(ts);
};

// Primeiro parágrafo de texto "limpo" de um markdown (para cartões e resumos)
G.resumoTexto = function (md, max = 160) {
  const t = String(md || '')
    .split('\n')
    .filter(l => l.trim() && !/^(#|!\[|```|---|\|)/.test(l.trim()))
    .join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>~]/g, '')
    .replace(/^\s*[-*]\s*(\[[ x]\]\s*)?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > max ? t.slice(0, max).replace(/\s\S*$/, '') + '…' : t;
};

G.copiar = async (texto) => {
  try { await navigator.clipboard.writeText(texto); G.aviso('Copiado!'); } catch { G.aviso('Não foi possível copiar', 'erro'); }
};

// append() nativo ignora null/false (evita "null" escrito na tela em blocos condicionais)
(function () {
  const original = Element.prototype.append;
  Element.prototype.append = function (...nos) {
    return original.apply(this, nos.flat().filter(n => n !== null && n !== undefined && n !== false));
  };
})();
