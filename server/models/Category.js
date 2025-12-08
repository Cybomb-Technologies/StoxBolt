// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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
CategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add a static method to find category by name or ID
CategorySchema.statics.findCategory = async function(identifier) {
  if (!identifier) return null;
  
  // Check if identifier is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return this.findById(identifier);
  }
  
  // Otherwise, treat it as a category name
  return this.findOne({ 
    name: { $regex: new RegExp(`^${identifier}$`, 'i') },
    isActive: true 
  });
};

module.exports = mongoose.model('Category', CategorySchema);