// NOTIFICATION FEATURE — New file for appointment-related functionality
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const Property = require('../models/Property')
const { sendAppointmentScheduledEmail } = require('../services/notificationService')

// NOTIFICATION FEATURE — Schedule an appointment for property viewing
const scheduleAppointment = async (req, res) => {
  try {
    const { propertyId, appointmentDate, appointmentTime } = req.body

    if (!propertyId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Please provide property, date and time' })
    }

    const property = await Property.findById(propertyId)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    const appointment = await Appointment.create({
      tenant: req.user._id,
      property: propertyId,
      appointmentDate,
      appointmentTime,
      status: 'scheduled'
    })

    const populatedAppointment = await appointment.populate('property').populate('tenant', 'name email phone')

    // NOTIFICATION FEATURE — Send appointment scheduled email to tenant
    const tenant = await User.findById(req.user._id)
    const landlord = await User.findById(property.landlord)

    await sendAppointmentScheduledEmail(
      tenant.email,
      tenant.name,
      property.name,
      appointmentDate,
      appointmentTime,
      { name: landlord.name, email: landlord.email, phone: landlord.phone }
    )

    res.status(201).json(populatedAppointment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// NOTIFICATION FEATURE — Get all appointments for a tenant
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ tenant: req.user._id })
      .populate('property')
      .populate('tenant', 'name email phone')
      .sort({ appointmentDate: -1 })
    res.json(appointments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// NOTIFICATION FEATURE — Get all appointments for a property (landlord only)
const getPropertyAppointments = async (req, res) => {
  try {
    const { propertyId } = req.params
    const property = await Property.findById(propertyId)

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const appointments = await Appointment.find({ property: propertyId })
      .populate('tenant', 'name email phone')
      .sort({ appointmentDate: 1 })
    res.json(appointments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// NOTIFICATION FEATURE — Cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    if (appointment.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    appointment.status = 'cancelled'
    await appointment.save()

    const populatedAppointment = await appointment.populate('property').populate('tenant', 'name email phone')
    res.json(populatedAppointment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  scheduleAppointment,
  getMyAppointments,
  getPropertyAppointments,
  cancelAppointment
}
