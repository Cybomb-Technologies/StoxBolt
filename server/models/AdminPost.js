const mongoose = require('mongoose');

const AdminPostSchema = new mongoose.Schema({
  // Original post data
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
    default: null
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
  
  // Approval system fields
  approvalStatus: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'changes_requested', 'scheduled_pending', 'scheduled_approved'],
    default: 'pending_review'
  },
  
  // Reference to main Post
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  
  // Tracking
  isUpdateRequest: {
    type: Boolean,
    default: false
  },
  isScheduledPost: {
    type: Boolean,
    default: false
  },
  originalPostData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Approval details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  reviewerNotes: {
    type: String,
    default: null
  },
  
  // Schedule approval
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
  
  // Version tracking
  version: {
    type: Number,
    default: 1
  },
  
  // Timestamps
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
AdminPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set metaTitle to title if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title;
  }
  
  // Set metaDescription to first 150 chars of body if not provided
  if (!this.metaDescription && this.body) {
    this.metaDescription = this.body.substring(0, 150) + '...';
  }
  
  // Check if this is a scheduled post
  if (this.publishDateTime && new Date(this.publishDateTime) > new Date()) {
    this.isScheduledPost = true;
  }
  
  // Set approval status for scheduled posts
  if (this.isScheduledPost) {
    if (this.scheduleApproved) {
      this.approvalStatus = 'scheduled_approved';
    } else {
      this.approvalStatus = 'scheduled_pending';
    }
  }
  
  next();
});

// Index for searching
AdminPostSchema.index({ title: 'text', body: 'text', tags: 'text' });
AdminPostSchema.index({ authorId: 1, approvalStatus: 1 });
AdminPostSchema.index({ approvalStatus: 1, createdAt: -1 });
AdminPostSchema.index({ isScheduledPost: 1, publishDateTime: 1 });
AdminPostSchema.index({ scheduleApproved: 1 });

module.exports = mongoose.model('AdminPost', AdminPostSchema);