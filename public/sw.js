/**
 * sw.js — Service Worker لـ PWA نقاء
 * يعمل offline ويخزن الملفات الأساسية
 */
const CACHE_NAME = 'naqaa-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
]

// تثبيت: خزّن الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// تفعيل: احذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: Network First للـ API، Cache First للصور والملفات الثابتة
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // تجاهل Supabase requests (دائماً من الشبكة)
  if (url.hostname.includes('supabase.co')) return

  // الصور: Cache First
  if (request.destination === 'image') {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone))
          }
          return res
        }).catch(() => cached || new Response('', { status: 404 }))
      })
    )
    return
  }

  // HTML: Network First مع fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // باقي الملفات: Network First
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// Push Notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const title   = data.title || 'نقاء'
  const options = {
    body:    data.body || 'لديك إشعار جديد',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-96.png',
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'عرض' },
      { action: 'close', title: 'إغلاق' }
    ]
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'view' || !e.action) {
    const url = e.notification.data?.url || '/'
    e.waitUntil(clients.openWindow(url))
  }
})
