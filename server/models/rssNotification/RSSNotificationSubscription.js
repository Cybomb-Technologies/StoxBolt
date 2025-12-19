const mongoose = require('mongoose');

const RSSNotificationSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true,
        index: true
    },
    subscriptionType: {
        type: String,
        enum: ['all', 'feed', 'category'],
        required: true,
        default: 'all'
    },
    feedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RSSFeedConfig',
        required: function () {
            return this.subscriptionType === 'feed';
        }
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function () {
            return this.subscriptionType === 'category';
        }
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
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
RSSNotificationSubscriptionSchema.index({ userId: 1, subscriptionType: 1 });
RSSNotificationSubscriptionSchema.index({ userId: 1, feedId: 1 });
RSSNotificationSubscriptionSchema.index({ userId: 1, categoryId: 1 });
RSSNotificationSubscriptionSchema.index({ isActive: 1 });

// Update timestamp before saving
RSSNotificationSubscriptionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if user is subscribed to a specific feed
RSSNotificationSubscriptionSchema.methods.isSubscribedToFeed = function (feedId) {
    return this.isActive &&
        (this.subscriptionType === 'all' ||
            (this.subscriptionType === 'feed' && this.feedId.toString() === feedId.toString()));
};

// Method to check if user is subscribed to a specific category
RSSNotificationSubscriptionSchema.methods.isSubscribedToCategory = function (categoryId) {
    return this.isActive &&
        (this.subscriptionType === 'all' ||
            (this.subscriptionType === 'category' && this.categoryId.toString() === categoryId.toString()));
};

// Static method to find active subscriptions for a feed
RSSNotificationSubscriptionSchema.statics.findActiveByFeed = function (feedId) {
    return this.find({
        $or: [
            { subscriptionType: 'all', isActive: true },
            { subscriptionType: 'feed', feedId: feedId, isActive: true }
        ]
    }).populate('userId', 'email username');
};

// Static method to find active subscriptions for a category
RSSNotificationSubscriptionSchema.statics.findActiveByCategory = function (categoryId) {
    return this.find({
        $or: [
            { subscriptionType: 'all', isActive: true },
            { subscriptionType: 'category', categoryId: categoryId, isActive: true }
        ]
    }).populate('userId', 'email username');
};

module.exports = mongoose.model('RSSNotificationSubscription', RSSNotificationSubscriptionSchema);
