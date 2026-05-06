self.addEventListener('push', function(event) {
  const data = event.data?.json() ?? {}
  const title = data.title || 'TradieFlow'
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
  }
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
