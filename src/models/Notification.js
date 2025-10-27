const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  type: { 
    type: String,
    enum: [
      'request_approved',
      'request_rejected',
      'edit_approved',
      'edit_rejected',
      'new_comment',
      'system'
    ],
    required: true
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  link: {
    type: String
  },
  metadata: {
    type: Object
  }
}, { 
  timestamps: true 
});

// Compound index for user's unread notifications
notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);