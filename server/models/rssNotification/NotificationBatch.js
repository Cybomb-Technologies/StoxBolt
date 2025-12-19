const mongoose = require('mongoose');

const NotificationBatchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData',
        required: true,
        index: true
    },
    feedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RSSFeedConfig',
        required: true
    },
    postIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    postCount: {
        type: Number,
        default: 0
    },
    batchType: {
        type: String,
        enum: ['hourly', 'daily', 'immediate'],
        default: 'hourly'
    },
    scheduledFor: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    errorMessage: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
NotificationBatchSchema.index({ userId: 1, status: 1 });
NotificationBatchSchema.index({ scheduledFor: 1, status: 1 });
NotificationBatchSchema.index({ feedId: 1, status: 1 });

// Static method to find pending batches ready to send
NotificationBatchSchema.statics.findReadyToSend = function () {
    return this.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() }
    }).populate('userId', 'email username')
        .populate('feedId', 'name brandName')
        .populate('postIds', 'title shortTitle imageUrl');
};

// Method to mark batch as sent
NotificationBatchSchema.methods.markAsSent = function () {
    this.status = 'sent';
    this.sentAt = new Date();
    return this.save();
};

// Method to mark batch as failed
NotificationBatchSchema.methods.markAsFailed = function (errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    return this.save();
};

module.exports = mongoose.model('NotificationBatch', NotificationBatchSchema);
