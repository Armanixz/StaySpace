// #chatsystem - Message model for real-time tenant-landlord chat system
const mongoose = require('mongoose');

/**
 * #chatsystem - Message model — stores chat messages between tenants and landlords.
 * Ensures one-to-one conversations with read status tracking
 * Fields: sender, receiver, propertyId (optional), text, read status, timestamps
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient conversation queries
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
