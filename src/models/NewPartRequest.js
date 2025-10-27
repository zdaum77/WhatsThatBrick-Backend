const mongoose = require('mongoose');

const newPartRequestSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  part_code: { 
    type: String, 
    trim: true,
    uppercase: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  category: {
    type: String,
    lowercase: true,
    trim: true
  },
  color_variants: [{ 
    name: String, 
    code: String 
  }],
  image_urls: [String],
  description: {
    type: String,
    maxlength: 2000
  },
  status: { 
    type: String, 
    enum: ['submitted', 'approved', 'rejected'], 
    default: 'submitted',
    index: true
  },
  admin_comment: String,
  date_handled: Date,
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: { 
    createdAt: 'date_submitted', 
    updatedAt: 'updatedAt' 
  } 
});

// Indexes for common queries
newPartRequestSchema.index({ status: 1, date_submitted: -1 });
newPartRequestSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('NewPartRequest', newPartRequestSchema);