import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Rss, Check, X, Loader2 } from 'lucide-react';
import {
    getUserSubscriptions,
    getAvailableFeeds,
    createSubscription,
    updateSubscription,
    deleteSubscription
} from '@/services/rssSubscriptionService';
import {
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribed as isPushSubscribed
} from '@/services/pushService';

const NotificationSettings = () => {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [availableFeeds, setAvailableFeeds] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);

    useEffect(() => {
        fetchData();
        checkPushStatus();
    }, []);

    const checkPushStatus = async () => {
        const supported = isPushSupported();
        setPushSupported(supported);
        if (supported) {
            const subscribed = await isPushSubscribed();
            setPushEnabled(subscribed);
        }
    };

    const handlePushToggle = async () => {
        try {
            setLoading(true);
            if (pushEnabled) {
                await unsubscribeFromPush();
                setPushEnabled(false);
                showSuccess('Desktop notifications disabled');
            } else {
                await subscribeToPush();
                setPushEnabled(true);
                showSuccess('Desktop notifications enabled!');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update push settings. Make sure you allow notifications in your browser.');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subsData, feedsData] = await Promise.all([
                getUserSubscriptions(),
                getAvailableFeeds()
            ]);
            setSubscriptions(subsData.subscriptions || []);
            setAvailableFeeds(feedsData.feeds || []);
        } catch (err) {
            setError('Failed to load notification settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribeToAll = async () => {
        try {
            await createSubscription({
                subscriptionType: 'all',
                channels: {
                    inApp: true,
                    webPush: false,
                    email: false
                }
            });
            showSuccess('Subscribed to all RSS feeds!');
            fetchData();
        } catch (err) {
            setError('Failed to subscribe to all feeds');
        }
    };

    const handleSubscribeToFeed = async (feedId) => {
        try {
            await createSubscription({
                subscriptionType: 'feed',
                feedId: feedId,
                channels: {
                    inApp: true,
                    webPush: false,
                    email: false
                }
            });
            showSuccess('Subscribed to feed!');
            fetchData();
        } catch (err) {
            setError('Failed to subscribe to feed');
        }
    };

    const handleUnsubscribe = async (subscriptionId) => {
        try {
            await deleteSubscription(subscriptionId);
            showSuccess('Unsubscribed successfully!');
            fetchData();
        } catch (err) {
            setError('Failed to unsubscribe');
        }
    };

    const handleToggleChannel = async (subscription, channel) => {
        try {
            const newChannels = {
                ...subscription.channels,
                [channel]: !subscription.channels[channel]
            };
            await updateSubscription(subscription._id, newChannels);
            showSuccess('Notification preferences updated!');
            fetchData();
        } catch (err) {
            setError('Failed to update preferences');
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const isSubscribedToFeed = (feedId) => {
        return subscriptions.some(sub =>
            (sub.subscriptionType === 'feed' && sub.feedId?._id === feedId) ||
            sub.subscriptionType === 'all'
        );
    };

    const isSubscribedToAll = () => {
        return subscriptions.some(sub => sub.subscriptionType === 'all');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                    </div>
                    <p className="text-gray-600">
                        Manage your RSS feed subscriptions and notification preferences
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">{successMessage}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                )}

                {/* Device Settings */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Settings</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900">Desktop Notifications</h3>
                            <p className="text-sm text-gray-600">
                                {pushSupported
                                    ? "Receive notifications on this device even when the app is closed"
                                    : "Push notifications are not supported on this browser"}
                            </p>
                        </div>
                        <button
                            onClick={handlePushToggle}
                            disabled={!pushSupported || loading}
                            className={`px-4 py-2 rounded-lg transition-colors duration-150 flex items-center gap-2 ${pushEnabled
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                pushEnabled ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            {pushEnabled ? 'Enabled on this Device' : 'Enable Desktop Notifications'}
                        </button>
                    </div>
                </div>

                {/* Subscribe to All */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Rss className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">All RSS Feeds</h3>
                                <p className="text-sm text-gray-600">
                                    Get notified about all new posts from all feeds
                                </p>
                            </div>
                        </div>
                        {isSubscribedToAll() ? (
                            <button
                                onClick={() => {
                                    const allSub = subscriptions.find(s => s.subscriptionType === 'all');
                                    if (allSub) handleUnsubscribe(allSub._id);
                                }}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-150 flex items-center gap-2"
                            >
                                <BellOff className="w-4 h-4" />
                                Unsubscribe
                            </button>
                        ) : (
                            <button
                                onClick={handleSubscribeToAll}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center gap-2"
                            >
                                <Bell className="w-4 h-4" />
                                Subscribe to All
                            </button>
                        )}
                    </div>

                    {/* Channel Toggles for All Feeds */}
                    {isSubscribedToAll() && (() => {
                        const allSub = subscriptions.find(s => s.subscriptionType === 'all');
                        if (!allSub) return null;

                        return (
                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Channels</h4>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allSub.channels.inApp}
                                            onChange={() => handleToggleChannel(allSub, 'inApp')}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">In-App</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allSub.channels.webPush}
                                            onChange={() => handleToggleChannel(allSub, 'webPush')}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Push</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer opacity-50 cursor-not-allowed">
                                        <input
                                            type="checkbox"
                                            checked={allSub.channels.email}
                                            disabled
                                            className="w-4 h-4 text-gray-400 rounded"
                                        />
                                        <span className="text-sm text-gray-500">Email (Coming Soon)</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Individual Feeds */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Individual Feeds</h2>

                    {availableFeeds.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No RSS feeds available yet
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {availableFeeds.map((feed) => {
                                const isSubscribed = isSubscribedToFeed(feed._id);
                                const subscription = subscriptions.find(sub =>
                                    sub.feedId?._id === feed._id
                                );

                                return (
                                    <div
                                        key={feed._id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-150"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {feed.brandName || feed.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {feed.description || feed.url}
                                                </p>
                                            </div>

                                            {isSubscribed || isSubscribedToAll() ? (
                                                <button
                                                    onClick={() => {
                                                        if (subscription) {
                                                            handleUnsubscribe(subscription._id);
                                                        }
                                                    }}
                                                    disabled={isSubscribedToAll()}
                                                    className={`px-4 py-2 rounded-lg transition-colors duration-150 flex items-center gap-2 ${isSubscribedToAll()
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Subscribed
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribeToFeed(feed._id)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-150 flex items-center gap-2"
                                                >
                                                    <Bell className="w-4 h-4" />
                                                    Subscribe
                                                </button>
                                            )}
                                        </div>

                                        {/* Channel Toggles */}
                                        {subscription && !isSubscribedToAll() && (
                                            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={subscription.channels.inApp}
                                                        onChange={() => handleToggleChannel(subscription, 'inApp')}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">In-App</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={subscription.channels.webPush}
                                                        onChange={() => handleToggleChannel(subscription, 'webPush')}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Push</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer opacity-50 cursor-not-allowed">
                                                    <input
                                                        type="checkbox"
                                                        checked={subscription.channels.email}
                                                        disabled
                                                        className="w-4 h-4 text-gray-400 rounded"
                                                    />
                                                    <span className="text-sm text-gray-500">Email (Coming Soon)</span>
                                                </label>
                                            </div>
                                        )}

                                        {isSubscribedToAll() && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Managed by "All Feeds" subscription
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
