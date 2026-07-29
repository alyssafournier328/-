// 跃升学堂 PWA Service Worker
// 离线优先：缓存应用壳与核心资源
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `yuesheng-edu-${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/components.css',
  './js/app.js',
  './js/core/storage.js',
  './js/core/auth.js',
  './js/core/progress.js',
  './js/core/recommender.js',
  './js/content/math-engine.js',
  './js/content/english-engine.js',
  './js/content/chinese-engine.js',
  './data/curriculum.json',
  './data/words.json',
  './data/classics.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // 单个资源失败不阻塞安装
        return Promise.all(
          APP_SHELL.map((url) => cache.add(url).catch(() => null))
        );
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // JS 模块与 HTML 入口：始终网络优先且绕过 HTTP 缓存，避免改后不生效
  const bypass = url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');
  const fetchReq = bypass ? new Request(req, { cache: 'no-store' }) : req;

  event.respondWith(
    fetch(fetchReq)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
