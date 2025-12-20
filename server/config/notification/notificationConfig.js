// Notification system configuration
module.exports = {
    // Throttling settings to prevent spam
    throttling: {
        enabled: true,
        maxNotificationsPerHour: 5,
        maxNotificationsPerDay: 20,
        batchingEnabled: true,
        batchingInterval: 60, // minutes
        batchingThreshold: 3 // Batch if more than 3 posts in interval
    },

    // Channel configurations
    channels: {
        webPush: {
            enabled: true,
            vapidKeys: {
                publicKey: process.env.VAPID_PUBLIC_KEY || '',
                privateKey: process.env.VAPID_PRIVATE_KEY || '',
                subject: process.env.VAPID_SUBJECT || 'mailto:admin@stoxbolt.com'
            },
            ttl: 24 * 60 * 60, // 24 hours
            urgency: 'normal' // 'very-low', 'low', 'normal', 'high'
        },
        inApp: {
            enabled: true,
            retentionDays: 30,
            maxNotificationsPerUser: 100,
            autoMarkReadAfterDays: 7
        },
        email: {
            enabled: false, // Optional feature
            from: process.env.EMAIL_FROM || 'notifications@stoxbolt.com',
            digestEnabled: false,
            digestSchedule: 'daily' // 'hourly', 'daily', 'weekly'
        }
    },

    // Default subscription settings for new users
    defaultSubscriptions: {
        subscriptionType: 'all', // Subscribe to all RSS feeds by default
        channels: {
            webPush: false, // Requires explicit permission
            inApp: true,
            email: false
        }
    },

    // Notification templates
    templates: {
        rssNewPost: {
            title: (feedName) => `New post from ${feedName}`,
            message: (postTitle) => postTitle,
            webPushTitle: (feedName) => `📰 ${feedName}`,
            webPushBody: (postTitle) => postTitle
        },
        rssBatchPost: {
            title: (feedName, count) => `${count} new posts from ${feedName}`,
            message: (count) => `${count} new articles available`,
            webPushTitle: (feedName, count) => `📰 ${feedName} (${count} new)`,
            webPushBody: (count) => `${count} new articles to read`
        }
    },

    // Notification priorities
    priorities: {
        rssNewPost: 'normal',
        rssBatchPost: 'low',
        system: 'high'
    },

    // Cleanup settings
    cleanup: {
        enabled: true,
        schedule: '0 2 * * *', // Run at 2 AM daily
        deleteReadAfterDays: 30,
        deleteUnreadAfterDays: 60,
        deleteBatchesAfterDays: 7
    },

    // Analytics settings
    analytics: {
        enabled: true,
        trackClicks: true,
        trackDelivery: true,
        trackReads: true
    }
};
