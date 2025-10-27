const mongoose = require('mongoose');

const colorVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String }
}, { _id: false });

const setAppearanceSchema = new mongoose.Schema({
  set_id: { type: String },
  set_name: { type: String },
  year: { type: Number }
}, { _id: false });

const brickSchema = new mongoose.Schema({
  part_code: { 
    type: String, 
    unique: true, 
    sparse: true, 
    trim: true,
    uppercase: true
  },
  name: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  category: { 
    type: String, 
    index: true,
    lowercase: true,
    trim: true
  },
  color_variants: [colorVariantSchema],
  image_urls: [{ 
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxlength: 2000
  },
  set_appearances: [setAppearanceSchema],
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: { 
    type: String, 
    enum: ['published', 'pending', 'rejected'], 
    default: 'published',
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
}, { 
  timestamps: true 
});

// Text index for search functionality
brickSchema.index({ 
  name: 'text', 
  description: 'text', 
  part_code: 'text',
  category: 'text'
});

// Compound indexes for common queries
brickSchema.index({ status: 1, createdAt: -1 });
brickSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Brick', brickSchema);