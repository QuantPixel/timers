const cacheName = 'cache-v0';

const appFiles = [
    './',
    './index.html',
    './images/favicon.ico',
    './images/icon-192.png',
	'./images/icon-512.png",
	'./images/icon-192-maskable.png",
	'./images/icon-512-maskable.png",
	'./fonts/Barlow.woff2",
	'./fonts/Lato-Regular.woff2",
	'./function.js",
    './style.css',
    './app.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appFiles);
    console.log('Service worker installed');
});

self.addEventListener('activate', async event => {
    const cachesKeys = await caches.keys();
    const checkKeys = cachesKeys.map(async key => {
        if (![cacheName].includes(key)) {
            await caches.delete(key);
        }
    });
    await Promise.all(checkKeys);
    console.log('Service worker activated');
});

self.addEventListener('fetch', event => {
    console.log(`Trying to fetch ${event.request.url}`);
    event.respondWith(checkCache(event.request));
});

async function checkCache(req) {
    const cachedResponse = await caches.match(req);
    return cachedResponse || checkOnline(req);
}