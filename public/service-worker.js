// Service Worker for Push Notifications
const CACHE_NAME = 'stoxbolt-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Push event - Receive push notifications
self.addEventListener('push', (event) => {
    // console.log('Service Worker: Push received', event);

    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/images/logo.png', // FIXED PATH
        badge: '/images/badge.png', // Assuming badge might be here too, or fallback
        data: {
            url: '/'
        }
    };

    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            // console.log('Service Worker: Push Payload:', data); // LOGGING PAYLOAD

            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                image: data.image,
                data: {
                    url: data.url || data.link || '/',
                    notificationId: data.notificationId,
                    postId: data.postId
                },
                tag: data.tag || 'notification',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            };
        } catch (error) {
            console.error('Service Worker: Error parsing push data', error);
        }
    }

    // console.log('Service Worker: Showing notification:', notificationData); // LOGGING ACTION

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            image: notificationData.image,
            data: notificationData.data,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            vibrate: notificationData.vibrate
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there's already a window open
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('Service Worker: Notification closed', event);
});

// Fetch event (optional - for offline support)
self.addEventListener('fetch', (event) => {
    // You can add caching strategies here if needed
});
