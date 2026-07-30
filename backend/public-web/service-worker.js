self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || 'Nouvelle notification';
  const options = {
    body: payload.body || 'Vous avez une nouvelle alerte.',
    icon: payload.icon || '/favicon.ico',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const role = event.notification?.data?.role;
  let path = '/';

  if (role === 'admin') path = '/admin/dashboard';
  if (role === 'cashier') path = '/cashier/sales';
  if (role === 'technician') path = '/technician/repairs';
  if (role === 'reseller') path = '/reseller';
  if (role === 'vip') path = '/vip';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'REFRESH_NOTIFICATIONS' });
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(path);
      }

      return null;
    })
  );
});
