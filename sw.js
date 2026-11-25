// Service worker: deixa o app funcionar offline e avisa a página quando há versão nova.
// A cada abertura a página manda {type:'CHECK'}: comparamos os arquivos do servidor com os guardados
// e, se algo mudou, atualizamos o cache e avisamos a página ({type:'UPDATED'}). Assim as atualizações
// chegam mesmo que o número da versão abaixo não seja alterado.
const CACHE = 'fittrack-v10';
const FILES = ['./', './index.html', './styles.css', './app.js', './exercises.js', './anim3d.js', './gamify.js', './programs.js', './manifest.json', './icon.svg'];
let hadOldCache = false;

const notify = () => self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage({ type: 'UPDATED' })));

self.addEventListener('install', e => e.waitUntil((async () => {
  hadOldCache = (await caches.keys()).some(k => k.startsWith('fittrack-') && k !== CACHE);
  const c = await caches.open(CACHE);
  await c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))); // ignora o cache HTTP do navegador
  self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
  if (hadOldCache) notify();
})()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});

async function checkUpdates() {
  const cache = await caches.open(CACHE), changed = [];
  await Promise.all(FILES.map(async f => {
    try {
      const res = await fetch(f, { cache: 'no-cache' }); // revalida no servidor (304 se não mudou)
      if (!res.ok) return;
      const old = await cache.match(f);
      const [novo, antigo] = await Promise.all([res.clone().text(), old ? old.text() : Promise.resolve(null)]);
      if (novo !== antigo) changed.push([f, res]);
    } catch { /* offline: sem checagem */ }
  }));
  if (changed.length) { await Promise.all(changed.map(([f, res]) => cache.put(f, res))); notify(); }
}

self.addEventListener('message', e => { if (e.data && e.data.type === 'CHECK') e.waitUntil(checkUpdates()); });
