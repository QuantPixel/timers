const staticCacheName = 'static-cache-v0';
const dynamicCacheName = 'dynamic-cache-v0';

const staticAssets = [
    './',
    './index.html',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/icon-192-maskable.png',
    './images/icon-512-maskable.png',
    './offline.html',
    './css/main.css',
    './js/app.js',
    './js/main.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(staticCacheName);
    await cache.addAll(staticAssets);
    console.log('Service worker has been installed');
});

self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (![staticCacheName, dynamicCacheName].includes(key)) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker has been activated');
});

self.addEventListener('fetch', event => {
    console.log(`Trying to fetch ${event.request.url}`);
    event.respondWith(checkCache(event.request));
});

