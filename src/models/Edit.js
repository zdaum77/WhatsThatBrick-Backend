const mongoose = require('mongoose');

const editSchema = new mongoose.Schema({
  brick_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Brick', 
    required: true,
    index: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  changes: { 
    type: Object, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    index: true
  },
  admin_comment: String,
  date_reviewed: Date,
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: { 
    createdAt: 'date_edited', 
    updatedAt: 'updatedAt' 
  } 
});

// Indexes for common queries
editSchema.index({ status: 1, date_edited: -1 });
editSchema.index({ brick_id: 1, status: 1 });

module.exports = mongoose.model('Edit', editSchema);