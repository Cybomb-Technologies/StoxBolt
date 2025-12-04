const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
   type: {
    type: String,
    enum: [
      // Existing values
      'create',
      'update', 
      'delete',
      'publish',
      'submission',
      
      // Add these approval-related values
      'approval_request',
      'update_request',
      'post_approved',
      'update_approved',
      'post_rejected',
      'changes_requested',
      'admin_post_updated'
    ],
    required: true
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
  title: {
    type: String,
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);