const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an item title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['Lost', 'Found'],
        message: 'Type must be either Lost or Found',
      },
      required: [true, 'Please specify if item is Lost or Found'],
    },
    category: {
      type: String,
      enum: {
        values: [
          'Electronics',
          'ID & Cards',
          'Clothing',
          'Books & Stationery',
          'Keys',
          'Bags & Wallets',
          'Personal Items',
          'Other',
        ],
        message: 'Please select a valid category',
      },
      required: [true, 'Please select an item category'],
    },
    description: {
      type: String,
      required: [true, 'Please provide an item description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Please specify the campus location'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Please provide the date of the occurrence'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image for the item'],
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'Claimed', 'Resolved'],
        message: 'Status must be Open, Claimed, or Resolved',
      },
      default: 'Open',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by status, type and text search
itemSchema.index({ type: 1, status: 1, category: 1 });
itemSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
