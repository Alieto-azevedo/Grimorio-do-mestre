// Service worker: deixa o app abrir sem internet.
// Arquivos do app: busca na rede primeiro (sempre a versão nova) e usa o cache se estiver offline.
// Bibliotecas do Firebase (gstatic): cache primeiro, pois a versão é fixa.
const CACHE = 'grimorio-v1';
const BASE = [
  './', 'index.html', 'manifest.webmanifest', 'config.js', 'css/app.css',
  'js/util.js', 'js/markdown.js', 'js/dados.js', 'js/tipos.js', 'js/statblock.js', 'js/armazenamento-local.js',
  'js/armazenamento-firebase.js', 'js/loja.js', 'js/ui.js', 'js/biblioteca.js', 'js/pagina.js', 'js/sessao.js',
  'js/combate.js', 'js/ferramentas.js', 'js/importar.js', 'js/conta.js', 'js/inicio.js',
  'dados/tabelas.js', 'icones/icone-192.png', 'icones/icone-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return resp;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(resp => {
    if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return resp;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
