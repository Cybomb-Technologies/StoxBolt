// models/Post.js
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
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
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'pending_approval', 'published', 'archived'],
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
  
  // Approval tracking
  lastApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  lastApprovedAt: {
    type: Date,
    default: null
  },
  
  // Scheduled post tracking
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleApproved: {
    type: Boolean,
    default: false
  },
  scheduleApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  scheduleApprovedAt: {
    type: Date,
    default: null
  },
  
  // Rejection tracking
  rejectionReason: {
    type: String,
    default: null
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
  
  // If publishDateTime is set and in future, set isScheduled to true
  if (this.publishDateTime && new Date(this.publishDateTime) > new Date()) {
    this.isScheduled = true;
    
    // Set appropriate status based on schedule approval
    if (this.scheduleApproved) {
      this.status = 'scheduled';
    } else {
      this.status = 'pending_approval';
    }
  } else if (this.publishDateTime && new Date(this.publishDateTime) <= new Date()) {
    // If publish date is in past and post is scheduled but not approved, mark as overdue
    if (this.isScheduled && !this.scheduleApproved) {
      this.status = 'pending_approval';
    } else if (this.isScheduled && this.scheduleApproved) {
      // If scheduled and approved but date passed, should be published by cron
      this.status = 'published';
      this.isScheduled = false;
    }
  }
  
  next();
});

// Index for searching
PostSchema.index({ title: 'text', body: 'text', tags: 'text' });
PostSchema.index({ isScheduled: 1, scheduleApproved: 1 });
PostSchema.index({ publishDateTime: 1, status: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);