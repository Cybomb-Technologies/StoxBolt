const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['create-post', 'rss-feed', 'rss-new-post', 'create-category', 'admin-post', 'system'],
        default: 'system'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        enum: ['Post', 'Category', 'AdminPost', 'RSSFeedConfig'],
        default: 'Post'
    },
    metadata: {
        postTitle: String,
        postCategory: String,
        feedName: String,
        postImage: String,
        postLink: String,
        additionalData: mongoose.Schema.Types.Mixed
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    channels: {
        webPush: {
            type: Boolean,
            default: false
        },
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: false
        }
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to mark notification as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Method to mark notification as unread
notificationSchema.methods.markAsUnread = function () {
    this.isRead = false;
    this.readAt = null;
    return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({ userId: userId, isRead: false });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany(
        { userId: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = function (userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null
    } = options;

    const query = { userId: userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    if (type) {
        query.type = type;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('relatedId');
};

// Static method to create RSS notification
notificationSchema.statics.createRSSNotification = function (userId, post, feedConfig) {
    return this.create({
        userId: userId,
        title: `New post from ${feedConfig.brandName}`,
        message: post.shortTitle || post.title,
        type: 'rss-new-post',
        relatedId: post._id,
        relatedModel: 'Post',
        metadata: {
            postTitle: post.title,
            postCategory: post.category?.name || 'General',
            feedName: feedConfig.name,
            postImage: post.imageUrl,
            postLink: `/post/${post._id}`
        },
        channels: {
            inApp: true,
            webPush: false,
            email: false
        }
    });
};

module.exports = mongoose.model('Notification', notificationSchema);
