const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    endpoint: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: false,
        index: true
    }
}, { timestamps: true });

// Index for efficient queries
pushSubscriptionSchema.index({ userId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
