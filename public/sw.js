// 웹 푸시 알림 서비스 워커
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: '예산 관리 시스템', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || '예산 관리 시스템'
  const options = {
    body: data.body || '',
    icon: data.icon || '/lsri_logo.png',
    badge: data.badge || '/lsri_logo.png',
    tag: data.tag || 'budget-notice',
    data: { url: data.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
