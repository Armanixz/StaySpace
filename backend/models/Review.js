const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings - one tenant can only rate a landlord once per property
reviewSchema.index({ property: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
