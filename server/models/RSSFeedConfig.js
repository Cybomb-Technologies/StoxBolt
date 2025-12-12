const mongoose = require('mongoose');

const RSSFeedConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name for this feed'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Please add the RSS feed URL'],
    trim: true,
    unique: true
  },
  brandName: {
    type: String,
    required: [true, 'Please add a brand name for the author'],
    trim: true,
    default: 'RSS Feed'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastFetchedAt: {
    type: Date,
    default: null
  },
  lastFetchStatus: {
    type: String,
    enum: ['success', 'error', 'pending', null],
    default: null
  },
  lastErrorMessage: {
    type: String,
    default: null
  },
  fetchIntervalMinutes: {
    type: Number,
    default: 60 // Default to 1 hour
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
RSSFeedConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RSSFeedConfig', RSSFeedConfigSchema);
