const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      // Core operations
      'create',
      'update', 
      'delete',
      'publish',
      'unpublish',
      'archive',
      
      // Approval system
      'approval_request',
      'update_request',
      'post_approved',
      'update_approved',
      'post_rejected',
      'changes_requested',
      'admin_post_updated',
      'approval_submitted',
      
      // Submission related
      'submission',
      'resubmission',
      
      // Schedule related
      'schedule_created',
      'schedule_approved',
      'schedule_rejected',
      'schedule_cancelled',
      'schedule_updated',
      
      // Draft related
      'draft_created',
      'draft_updated',
      'draft_submitted',
      
      // User/system actions
      'login',
      'logout',
      'user_created',
      'user_updated',
      'user_deleted',
      'system',
      
      // Generic/fallback
      'action',
      'notification',
      'error'
    ],
    default: 'action'
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  user: {
    type: String,
    required: true
  },
  
  userDetails: {
    name: String,
    email: String,
    role: String
  },
  
  title: {
    type: String,
    required: true,
    default: 'Untitled Activity'
  },
  
  description: {
    type: String,
    default: ''
  },
  
  entityType: {
    type: String,
    enum: ['post', 'adminpost', 'user', 'system', 'schedule', 'draft', 'approval'],
    default: 'post'
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  adminPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminPost'
  },
  
  // Detailed metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Action details
  action: {
    type: String,
    default: ''
  },
  
  // Status before and after
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  currentState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Change tracking
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // IP Address for audit trail
  ipAddress: {
    type: String,
    default: ''
  },
  
  // User agent for audit trail
  userAgent: {
    type: String,
    default: ''
  },
  
  // Severity level
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical', 'success'],
    default: 'info'
  },
  
  // Additional context
  context: {
    module: String,
    feature: String,
    component: String,
    version: String,
    environment: String
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Expiration for auto-cleanup (optional)
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound indexes for faster queries
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ type: 1, timestamp: -1 });
ActivitySchema.index({ entityType: 1, entityId: 1 });
ActivitySchema.index({ 'metadata.category': 1 });
ActivitySchema.index({ 'metadata.status': 1 });
ActivitySchema.index({ severity: 1, timestamp: -1 });

// Text search index
ActivitySchema.index({
  title: 'text',
  description: 'text',
  'userDetails.name': 'text',
  'userDetails.email': 'text',
  action: 'text'
});

// Pre-save middleware to ensure data consistency
ActivitySchema.pre('save', function(next) {
  // Ensure user details are consistent
  if (!this.userDetails) {
    this.userDetails = {};
  }
  
  // Set entityId based on entityType if not provided
  if (!this.entityId) {
    if (this.postId) {
      this.entityType = 'post';
      this.entityId = this.postId;
    } else if (this.adminPostId) {
      this.entityType = 'adminpost';
      this.entityId = this.adminPostId;
    }
  }
  
  // Set expiration (e.g., 90 days for info logs, 1 year for critical)
  if (!this.expiresAt) {
    const expirationDays = {
      'info': 90,
      'warning': 180,
      'error': 365,
      'critical': 365,
      'success': 90
    };
    
    const days = expirationDays[this.severity] || 90;
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + days);
  }
  
  next();
});

// Static method for creating activity with full context
ActivitySchema.statics.createWithContext = async function(data) {
  try {
    const activityData = {
      ...data,
      timestamp: data.timestamp || new Date(),
      context: {
        module: data.context?.module || 'unknown',
        feature: data.context?.feature || 'unknown',
        component: data.context?.component || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    return await this.create(activityData);
  } catch (error) {
    console.error('Failed to create activity with context:', error);
    // Create a minimal activity to ensure audit trail
    return await this.create({
      type: 'error',
      userId: data.userId || 'system',
      user: data.user || 'System',
      title: 'Activity Creation Failed',
      description: error.message,
      severity: 'error',
      metadata: { originalData: data, error: error.message }
    });
  }
};

// Instance method to get formatted log message
ActivitySchema.methods.toLogMessage = function() {
  return `[${this.timestamp.toISOString()}] [${this.type.toUpperCase()}] [${this.user}] - ${this.title} - ${JSON.stringify(this.metadata)}`;
};

// Virtual for readable date
ActivitySchema.virtual('readableDate').get(function() {
  return this.timestamp.toLocaleString();
});

// Set toObject and toJSON options to include virtuals
ActivitySchema.set('toObject', { virtuals: true });
ActivitySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Activity', ActivitySchema);