// Utilidades gerais
window.G = window.G || {};

G.$ = (sel, raiz = document) => raiz.querySelector(sel);
G.$$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

// G.h('div', {class:'x', onclick}, 'texto', no, [lista])
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
  const add = (f) => {
    if (f === null || f === undefined || f === false) return;
    if (Array.isArray(f)) return f.forEach(add);
    el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
  };
  filhos.forEach(add);
  return el;
};

(function () {
  const original = Element.prototype.append;
  Element.prototype.append = function (...nos) {
    return original.apply(this, nos.flat(Infinity).filter(n => n !== null && n !== undefined && n !== false));
  };
})();

G.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
G.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);
G.limitar = (n, min, max) => Math.max(min, Math.min(max, n));
G.normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
G.aleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];
G.maiuscula = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;

G.debounce = function (fn, ms) {
  let t, ultimos;
  const d = (...a) => { ultimos = a; clearTimeout(t); t = setTimeout(() => { t = null; fn(...a); }, ms); };
  d.agora = () => { if (t) { clearTimeout(t); t = null; fn(...(ultimos || [])); } };
  return d;
};

G.dataCurta = (v) => v ? new Date(typeof v === 'string' && v.length === 10 ? v + 'T12:00' : v).toLocaleDateString('pt-BR') : '';
G.horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
G.tempoRelativo = function (ts) {
  if (!ts) return '';
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `há ${Math.floor(s / 86400)} d`;
  return G.dataCurta(ts);
};

G.resumoTexto = function (md, max = 140) {
  const t = String(md || '').split('\n')
    .filter(l => l.trim() && !/^(#|!\[|```|---|\|)/.test(l.trim()))
    .map(l => l.replace(/^\s*([-*+]|\d+\.)\s+(\[[ xX]\]\s*)?/, '').replace(/^>\s?/, ''))
    .join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>~]/g, '')
    .replace(/^\s*[-*]\s*(\[[ x]\]\s*)?/gm, '')
    .replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max).replace(/\s\S*$/, '') + '…' : t;
};

G.copiar = async (texto) => {
  try { await navigator.clipboard.writeText(texto); G.aviso('Copiado'); } catch { G.aviso('Não foi possível copiar', 'erro'); }
};

// Reduz e comprime imagens antes de guardar (cabe no Firestore e economiza dados móveis)
G.comprimirImagem = function (arquivo, maxLado = 1000, qualidade = 0.8) {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const esc = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#222'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = qualidade, dados = c.toDataURL('image/jpeg', q);
      while (dados.length > 700000 && q > 0.4) { q -= 0.1; dados = c.toDataURL('image/jpeg', q); }
      ok(dados);
    };
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Imagem inválida')); };
    img.src = url;
  });
};

G.escolherArquivo = (accept) => new Promise(ok => {
  const inp = G.h('input', { type: 'file', accept, style: { display: 'none' } });
  inp.addEventListener('change', () => { ok(inp.files[0] || null); inp.remove(); });
  document.body.appendChild(inp);
  inp.click();
});

G.vibrar = (ms = 15) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* ignora */ } };
