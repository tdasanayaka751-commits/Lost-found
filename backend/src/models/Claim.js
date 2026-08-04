const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Claim must reference an item'],
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claim must belong to a claimant user'],
    },
    proofDetails: {
      type: String,
      required: [
        true,
        'Please provide proof or distinguishing details to verify ownership',
      ],
      maxlength: [1000, 'Proof details cannot exceed 1000 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Please provide a valid contact number'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        message: 'Status must be Pending, Approved, Rejected, or Cancelled',
      },
      default: 'Pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help enforce active claim lookup
claimSchema.index({ itemId: 1, claimant: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
