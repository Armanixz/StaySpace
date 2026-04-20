const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  scheduleAppointment,
  getMyAppointments,
  getPropertyAppointments,
  cancelAppointment
} = require('../controllers/appointmentController')

// NOTIFICATION FEATURE — Tenant-only middleware
const tenantOnly = (req, res, next) => {
  if (req.user && req.user.role === 'tenant') {
    return next()
  }
  res.status(403).json({ message: 'Access denied: Tenants only' })
}

// NOTIFICATION FEATURE — Landlord-only middleware
const landlordOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'landlord' || req.user.role === 'admin')) {
    return next()
  }
  res.status(403).json({ message: 'Access denied: Landlords only' })
}

// NOTIFICATION FEATURE — Schedule an appointment
// @route   POST /api/appointments
router.post('/', protect, tenantOnly, scheduleAppointment)

// NOTIFICATION FEATURE — Get tenant's appointments
// @route   GET /api/appointments/my
router.get('/my', protect, tenantOnly, getMyAppointments)

// NOTIFICATION FEATURE — Get appointments for a property (landlord only)
// @route   GET /api/appointments/property/:propertyId
router.get('/property/:propertyId', protect, landlordOnly, getPropertyAppointments)

// NOTIFICATION FEATURE — Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
router.put('/:id/cancel', protect, tenantOnly, cancelAppointment)

module.exports = router
