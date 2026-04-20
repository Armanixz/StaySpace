const mongoose = require('mongoose');

/**
 * History model — tracks property visits by tenants
 * Records when a tenant views a property details page
 * Fields: tenant (ref: User), property (ref: Property), visitedAt (timestamp)
 */
const historySchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying - tenant + property combination should be unique
// This prevents duplicate records for the same tenant visiting the same property multiple times
historySchema.index({ tenant: 1, property: 1 });

// Index for sorting by visit time
historySchema.index({ tenant: 1, visitedAt: -1 });

module.exports = mongoose.model('History', historySchema);
