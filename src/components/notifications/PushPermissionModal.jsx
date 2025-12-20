import React, { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import {
    requestPermission,
    subscribeToPush,
    isPushSupported,
    registerServiceWorker
} from '@/services/pushService';
import { createSubscription } from '@/services/rssSubscriptionService';

const PushPermissionModal = ({ onClose, userName }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleEnableNotifications = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check if push is supported
            if (!isPushSupported()) {
                setError('Push notifications are not supported in your browser');
                setLoading(false);
                return;
            }

            // Register service worker
            await registerServiceWorker();

            // Request permission
            const permission = await requestPermission();

            if (permission === 'granted') {
                // Subscribe to push notifications
                await subscribeToPush();

                // Auto-subscribe to all RSS feeds
                await createSubscription({
                    subscriptionType: 'all',
                    channels: {
                        inApp: true,
                        webPush: true,
                        email: false
                    }
                });

                // Store preference
                localStorage.setItem('notificationPermissionAsked', 'true');
                localStorage.setItem('notificationEnabled', 'true');

                // Close modal
                onClose(true);
            } else {
                setError('Permission denied. You can enable notifications later in settings.');
                localStorage.setItem('notificationPermissionAsked', 'true');
                localStorage.setItem('notificationEnabled', 'false');
                setTimeout(() => onClose(false), 2000);
            }
        } catch (err) {
            console.error('Error enabling notifications:', err);
            setError('Failed to enable notifications. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleMaybeLater = () => {
        localStorage.setItem('notificationPermissionAsked', 'true');
        localStorage.setItem('notificationEnabled', 'false');
        onClose(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
                {/* Close button */}
                <button
                    onClick={handleMaybeLater}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bell className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Stay Updated!
                </h2>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6">
                    {userName ? `Hi ${userName}! ` : ''}
                    Get instant notifications about new market updates and breaking news.
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            Real-time alerts for breaking financial news
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            Never miss important market updates
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            Customize your notification preferences anytime
                        </p>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleEnableNotifications}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Enabling...
                            </>
                        ) : (
                            <>
                                <Bell className="w-5 h-5" />
                                Enable Notifications
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleMaybeLater}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    You can change your notification preferences anytime in settings
                </p>
            </div>
        </div>
    );
};

export default PushPermissionModal;
