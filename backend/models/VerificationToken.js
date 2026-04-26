const mongoose = require('mongoose');

// 2-STEP VERIFICATION FEATURE — Temporary storage for pending verifications
const verificationTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    verificationCode: {
      type: String,
      required: true,
    },
    verificationCodeExpiry: {
      type: Date,
      required: true,
    },
    registrationData: {
      name: String,
      password: String,
      phone: String,
      role: {
        type: String,
        enum: ['tenant', 'landlord'],
      },
    },
  },
  { timestamps: true }
);

// Auto-delete expired tokens
verificationTokenSchema.index({ verificationCodeExpiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
