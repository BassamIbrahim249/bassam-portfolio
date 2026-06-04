// service-worker.js — BassamIbrahim Portfolio v3.1 (Production Ready)
// ═══════════════════════════════════════════════════════════
// 📦 إعدادات الكاش
// ═══════════════════════════════════════════════════════════
const CACHE_VERSION = 'v3.1';
const CACHE_NAME = `bassam-portfolio-${CACHE_VERSION}`;

// الملفات الأساسية التي يجب تخزينها
const ASSETS_TO_CACHE = [
  // 📄 الصفحات الأساسية
  '/bassam-portfolio/',
  '/bassam-portfolio/index.html',
  '/bassam-portfolio/manifest.json',
  
  // 🖼️ الأيقونات والصور
  '/bassam-portfolio/icon_192.png',
  '/bassam-portfolio/icon_512.png',
  '/bassam-portfolio/preview.jpg',
  '/bassam-portfolio/profile.jpg',
  
  // 🧠 المساعد الذكي والملفات المهمة
  '/bassam-portfolio/smart-assistant.js',
  
  // 📚 البيانات (5 أقسام)
  '/bassam-portfolio/data/engineering.json',
  '/bassam-portfolio/data/political.json',
  '/bassam-portfolio/data/nubian.json',
  '/bassam-portfolio/data/academy.json',
  '/bassam-portfolio/data/lifestyle.json',
  '/bassam-portfolio/library_index.json',
  '/bassam-portfolio/data/knowledge-base.json', // 🆕 استعداداً للمهمة الأولى
  
  // 🔧 مكتبات CDN الصغيرة فقط (DOMPurify ~25KB)
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.4/purify.min.js',
  
  // 🖋️ الخطوط
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
];

// النطاقات المسموح بها للكاش
const ALLOWED_DOMAINS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ═══════════════════════════════════════════════════════════
// 🔧 التثبيت (Install)
// ═══════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {  console.log('🔧 [SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ [SW] Cache opened:', CACHE_NAME);
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ [SW] Failed to cache: ${url}`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// ═══════════════════════════════════════════════════════════
// 🔄 التفعيل (Activate) - تنظيف الكاش القديم
// ═══════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('🔄 [SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
        
        if (oldCaches.length > 0) {
          console.log('🗑️ [SW] Deleting old caches:', oldCaches);
        }
        
        return Promise.all(
          oldCaches.map(name => caches.delete(name))
        );
      })
      .then(() => {
        console.log('✅ [SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════
// 🌐 الجلب (Fetch) - استراتيجيات ذكية
// ═══════════════════════════════════════════════════════════self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;
  
  let url;
  try {
    url = new URL(event.request.url);
  } catch (err) {
    return; // URL غير صالح
  }
  
  // التحقق من النطاق المسموح
  const isLocal = url.origin === self.location.origin;
  const isAllowedCDN = ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain));
  
  if (!isLocal && !isAllowedCDN) {
    return; // تجاهل الطلبات من نطاقات أخرى (مثل Vercel API)
  }
  
  // تحديد نوع المورد
  const isJSON = url.pathname.endsWith('.json');
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname);
  const isFont = url.hostname.includes('fonts.');
  
  // ═══════════════════════════════════════════════════════
  // الاستراتيجية 1: Cache First (للملفات المحلية الثابتة)
  // ═══════════════════════════════════════════════════════
  if (isLocal && !isJSON) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // إرجاع من الكاش + تحديث في الخلفية
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        
        // غير موجود في الكاش → جلب من الشبكة
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }          return networkResponse;
        });
      })
    );
    return;
  }
  
  // ═══════════════════════════════════════════════════════
  // الاستراتيجية 2: Stale-While-Revalidate (للبيانات JSON)
  // ═══════════════════════════════════════════════════════
  if (isJSON) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              console.warn('⚠️ [SW] Network failed, using cache for:', url.pathname);
              return cachedResponse;
            });
          
          // إرجاع الكاش فوراً إن وُجد، وإلا انتظر الشبكة
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // ═══════════════════════════════════════════════════════
  // الاستراتيجية 3: Network First (للـ CDN والصور)
  // ═══════════════════════════════════════════════════════
  if (isAllowedCDN || isImage || isFont) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {          // فشل الشبكة → محاولة من الكاش
          return caches.match(event.request);
        })
    );
    return;
  }
});

// ═══════════════════════════════════════════════════════════
// 📨 الاستماع للرسائل (تحديث فوري)
// ═══════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ [SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => 
        Promise.all(urls.map(url => cache.add(url).catch(() => {})))
      )
    );
  }
});

// ═══════════════════════════════════════════════════════════
// 🔔 Push Notifications (جاهز للمستقبل)
// ═══════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'تحديث جديد!',
    icon: '/bassam-portfolio/icon_192.png',
    badge: '/bassam-portfolio/icon_192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/bassam-portfolio/' },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'dismiss', title: 'لاحقاً' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'BassamIbrahim', options)
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

console.log('🤖 [SW] Service Worker v3.1 loaded');