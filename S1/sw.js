const cacheName = 'cache-v0';

const cacheFiles = [
    './',
    './index.html',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/icon-192-maskable.png',
    './images/icon-512-maskable.png',
    './fonts/Barlow.woff2',
	'./fonts/Lato-Regular.woff2',
	'./function.js',
    './style.css',
    './app.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(cacheFiles);
    console.log('Service worker has been installed');
});

self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (cacheName != key) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker has been activated');
});

self.addEventListener('fetch', event => {
    console.log(`Trying to fetch ${event.request.url}`);
    event.respondWith(caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request)
    }));
});
