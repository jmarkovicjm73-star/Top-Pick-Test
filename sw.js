// TOP PICK – Service Worker
// Speichert Bilder, Sounds, Musik und Schriften lokal auf dem Gerät.
// Die Seite selbst wird immer zuerst frisch geladen (Updates kommen sofort an),
// bei fehlender Verbindung startet sie aus dem Speicher.
const C = 'tp-v1';
const MEDIA = /\.(png|jpe?g|webp|gif|svg|mp3|m4a|ogg|wav|aac|woff2?|json)$/i;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === self.location.origin;
  const font = u.host === 'fonts.gstatic.com' || u.host === 'fonts.googleapis.com';

  // Seite: erst Netz, sonst Speicher
  if (same && r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(C).then(x => x.put(r, c)); return res; })
      .catch(() => caches.match(r).then(h => h || caches.match('./'))));
    return;
  }
  if (!((same && MEDIA.test(u.pathname)) || font)) return;

  // Musik spielt mit "Range"-Anfragen: aus dem Speicher stückweise ausliefern
  if (r.headers.has('range')) {
    e.respondWith(caches.open(C).then(c => c.match(r.url)).then(hit => {
      if (!hit) return fetch(r);
      return hit.blob().then(b => {
        const m = /bytes=(\d*)-(\d*)/.exec(r.headers.get('range') || '');
        const s = m && m[1] ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], b.size - 1) : b.size - 1;
        const part = b.slice(s, end + 1);
        return new Response(part, { status: 206, headers: {
          'Content-Range': `bytes ${s}-${end}/${b.size}`, 'Content-Length': String(part.size),
          'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Accept-Ranges': 'bytes' } });
      });
    }).catch(() => fetch(r)));
    return;
  }

  // Bilder, Sounds, Schriften: sofort aus dem Speicher, im Hintergrund aktualisieren
  e.respondWith(caches.open(C).then(c => c.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
