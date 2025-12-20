import axios from 'axios';

const API_URL = 'http://localhost:5000/api/push';

/**
 * Check if push notifications are supported
 */
export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Register service worker
 */
export const registerServiceWorker = async () => {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported');
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
    }
};

/**
 * Request notification permission
 */
export const requestPermission = async () => {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Get VAPID public key from server
 */
const getVapidPublicKey = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/vapid-public-key`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return response.data.publicKey;
    } catch (error) {
        console.error('Error getting VAPID key:', error);
        throw error;
    }
};

/**
 * Convert VAPID key to Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async () => {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported');
    }

    try {
        // Register service worker
        const registration = await navigator.serviceWorker.ready;

        // Get VAPID public key
        const vapidPublicKey = await getVapidPublicKey();
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        // Send subscription to server
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/subscribe`, subscription, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        // console.log('Push subscription successful:', subscription);
        return subscription;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        throw error;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async () => {
    if (!isPushSupported()) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Unsubscribe from browser
            await subscription.unsubscribe();

            // Remove from server
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/unsubscribe`,
                { endpoint: subscription.endpoint },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // console.log('Push unsubscription successful');
        }
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        throw error;
    }
};

/**
 * Get current push subscription
 */
export const getSubscription = async () => {
    if (!isPushSupported()) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription;
    } catch (error) {
        console.error('Error getting subscription:', error);
        return null;
    }
};

/**
 * Check if user is subscribed to push
 */
export const isSubscribed = async () => {
    const subscription = await getSubscription();
    return subscription !== null;
};
