/* Service Worker — Kelas PJOK Online (pembungkus PWA di GitHub Pages)
 * - Cangkang (index.html, manifest, ikon) disimpan agar aplikasi terbuka instan & tampil layar offline.
 * - Permintaan ke Google (script.google.com / googleusercontent.com / fonts) TIDAK PERNAH di-cache:
 *   data aplikasi selalu langsung dari Apps Script.
 * Naikkan VERSI setiap kali mengubah berkas di repositori agar HP mengambil versi baru. */
const VERSI = 'pjok-pwa-v1';
const CANGKANG = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(CANGKANG)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Jangan sentuh layanan Google & domain lain — biarkan browser yang menangani.
  if (url.origin !== self.location.origin) return;

  // Halaman (navigasi): jaringan dulu agar pembaruan cepat terlihat, cadangan dari cache saat offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const salin = res.clone(); caches.open(VERSI).then((c) => c.put('./index.html', salin)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Aset statis: cache dulu, perbarui di latar (stale-while-revalidate).
  e.respondWith(
    caches.match(req).then((tersimpan) => {
      const segar = fetch(req).then((res) => {
        if (res && res.ok) { const salin = res.clone(); caches.open(VERSI).then((c) => c.put(req, salin)); }
        return res;
      }).catch(() => tersimpan);
      return tersimpan || segar;
    })
  );
});
