import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Precache all built assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old caches and take control
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

// 🔔 PUSH NOTIFICATION LISTENER
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/img/logo-luxessence.svg',
            badge: '/img/logo-luxessence.svg',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/admin/dashboard'
            },
            actions: [
                { action: 'open', title: 'Ver Detalles' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Alerta LuxOS', options)
        );
    } catch (e) {
        console.error('Error receiving push:', e);
    }
});

// 🖱️ NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there is already a window open with this URL
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
