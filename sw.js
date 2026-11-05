// TOP PICK – Service Worker: macht die Seite installierbar.
// Er speichert nichts zwischen, damit Updates sofort ankommen.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
