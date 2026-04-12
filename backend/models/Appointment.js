const mongoose = require('mongoose')

// NOTIFICATION FEATURE — Appointment model for property viewings scheduled by tenants
const appointmentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Appointment', appointmentSchema)
