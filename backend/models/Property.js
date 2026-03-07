const mongoose = require('mongoose');

/**
 * Arman
 * Property model — stores rental listings created by landlords.
 * Fields: name, address, type (enum), rent, location, images (URLs), landlord (ref: User)
 * Used by: propertyController, GET /api/properties, POST /api/properties
 */
const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Room', 'Flat', 'Studio', 'House', 'Other'],
      required: true,
    },
    rent: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    images: [{ type: String }],
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
