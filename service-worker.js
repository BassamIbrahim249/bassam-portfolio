// service-worker.js — BassamIbrahim Portfolio
const CACHE_NAME = 'bassam-portfolio-v2'; // <-- تم تغيير اسم الكاش لمسح القديم تلقائياً
const ASSETS_TO_CACHE = [
  '/bassam-portfolio/',
  '/bassam-portfolio/index.html',
  '/bassam-portfolio/manifest.json',
  '/bassam-portfolio/icon.jpg',
  '/bassam-portfolio/preview.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.4/purify.min.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  // ✅ دعم الملفات المنفصلة الجديدة
  '/bassam-portfolio/data/engineering.json',
  '/bassam-portfolio/data/political.json',
  '/bassam-portfolio/data/nubian.json',
  '/bassam-portfolio/data/academy.json',
  '/bassam-portfolio/data/lifestyle.json',
  '/bassam-portfolio/library_index.json'
];

// التثبيت: تخزين الموارد الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ فتح الكاش:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('⚠️ بعض الموارد لم تُخزن:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// التفعيل: مسح الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => {
          console.log('🗑️ مسح الكاش القديم:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// الجلب: الشبكة أولاً، ثم الكاش
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.hostname !== self.location.hostname && 
      !url.hostname.includes('cdnjs.cloudflare.com') &&
      !url.hostname.includes('cdn.tailwindcss.com') &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com') &&
      !url.hostname.includes('unpkg.com')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});