const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  shortTitle: {
    type: String,
    required: [true, 'Please add a short title'],
    trim: true,
    maxlength: [100, 'Short title cannot be more than 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Please add body text']
  },
  category: {
    type: String,
    required: true,
    enum: ['Indian', 'US', 'Global', 'Commodities', 'Forex', 'Crypto', 'IPOs']
  },
  tags: [{
    type: String,
    trim: true
  }],
  region: {
    type: String,
    default: 'India',
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Please add an author']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  publishDateTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'draft'
  },
  isSponsored: {
    type: Boolean,
    default: false
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  views: {
    type: Number,
    default: 0
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

// Update updatedAt timestamp
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set metaTitle to title if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title;
  }
  
  // Set metaDescription to first 150 chars of body if not provided
  if (!this.metaDescription && this.body) {
    this.metaDescription = this.body.substring(0, 150) + '...';
  }
  
  next();
});

// Index for searching
PostSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('Post', PostSchema);