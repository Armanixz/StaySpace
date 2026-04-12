// NOTIFICATION FEATURE — Service to handle sending email notifications to tenants
const transporter = require('../config/emailConfig')
const {
  propertyBookedTemplate,
  priceUpdatedTemplate,
  bookingRequestTemplate,
  bookingAcceptedTemplate,
  appointmentScheduledTemplate,
  bookingRejectedTemplate
} = require('../utils/emailTemplates')

// NOTIFICATION FEATURE — Send email when wishlisted property gets booked
const sendPropertyBookedEmail = async (tenantEmail, tenantName, propertyName, checkInDate, checkOutDate) => {
  try {
    const htmlContent = propertyBookedTemplate(tenantName, propertyName, checkInDate, checkOutDate)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Your Wishlisted Property "${propertyName}" Is Now Unavailable!`,
      html: htmlContent
    })
    
    console.log(`Property booked email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending property booked email:', error)
  }
}

// NOTIFICATION FEATURE — Send email when price is updated for wishlisted property
const sendPriceUpdatedEmail = async (tenantEmail, tenantName, propertyName, oldPrice, newPrice, landlord) => {
  try {
    const htmlContent = priceUpdatedTemplate(tenantName, propertyName, oldPrice, newPrice, landlord.name, landlord.email, landlord.phone)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Price Update for "${propertyName}"`,
      html: htmlContent
    })
    
    console.log(`Price updated email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending price updated email:', error)
  }
}

// NOTIFICATION FEATURE — Send email when booking request is submitted
const sendBookingRequestEmail = async (tenantEmail, tenantName, propertyName, checkInDate, checkOutDate, landlord) => {
  try {
    const htmlContent = bookingRequestTemplate(tenantName, propertyName, checkInDate, checkOutDate, landlord.name, landlord.email, landlord.phone)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Booking Request Received for "${propertyName}"`,
      html: htmlContent
    })
    
    console.log(`Booking request email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending booking request email:', error)
  }
}

// NOTIFICATION FEATURE — Send email when booking is accepted by landlord
const sendBookingAcceptedEmail = async (tenantEmail, tenantName, propertyName, checkInDate, checkOutDate, landlord) => {
  try {
    const htmlContent = bookingAcceptedTemplate(tenantName, propertyName, checkInDate, checkOutDate, landlord.name, landlord.email, landlord.phone)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Booking Confirmed for "${propertyName}"! 🎉`,
      html: htmlContent
    })
    
    console.log(`Booking accepted email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending booking accepted email:', error)
  }
}

// NOTIFICATION FEATURE — Send email when appointment is scheduled
const sendAppointmentScheduledEmail = async (tenantEmail, tenantName, propertyName, appointmentDate, appointmentTime, landlord) => {
  try {
    const htmlContent = appointmentScheduledTemplate(tenantName, propertyName, appointmentDate, appointmentTime, landlord.name, landlord.email, landlord.phone)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Appointment Scheduled for "${propertyName}"`,
      html: htmlContent
    })
    
    console.log(`Appointment scheduled email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending appointment scheduled email:', error)
  }
}

// NOTIFICATION FEATURE — Send emails to all tenants with wishlisted property when it gets booked (excluding the tenant who booked it)
const notifyWishlistOnBooking = async (propertyId, checkInDate, checkOutDate, bookingTenantId) => {
  try {
    const User = require('../models/User')
    const Property = require('../models/Property')
    
    const property = await Property.findById(propertyId)
    const tenantsWithWishlist = await User.find({
      'wishlist': propertyId,
      role: 'tenant',
      '_id': { $ne: bookingTenantId }  // Exclude the tenant who booked the property
    })
    
    for (const tenant of tenantsWithWishlist) {
      await sendPropertyBookedEmail(
        tenant.email,
        tenant.name,
        property.name,
        checkInDate,
        checkOutDate
      )
    }
  } catch (error) {
    console.error('Error notifying wishlist on booking:', error)
  }
}

// NOTIFICATION FEATURE — Send price updated emails to all tenants with wishlisted property
const notifyWishlistOnPriceUpdate = async (propertyId, oldPrice, newPrice, landlord) => {
  try {
    const User = require('../models/User')
    const Property = require('../models/Property')
    
    const property = await Property.findById(propertyId)
    const tenantsWithWishlist = await User.find({
      'wishlist': propertyId,
      role: 'tenant'
    })
    
    for (const tenant of tenantsWithWishlist) {
      await sendPriceUpdatedEmail(
        tenant.email,
        tenant.name,
        property.name,
        oldPrice,
        newPrice,
        { name: landlord.name, email: landlord.email, phone: landlord.phone }
      )
    }
  } catch (error) {
    console.error('Error notifying wishlist on price update:', error)
  }
}

// NOTIFICATION FEATURE — Send email when booking is rejected by landlord
const sendBookingRejectedEmail = async (tenantEmail, tenantName, propertyName, checkInDate, checkOutDate, landlord) => {
  try {
    const htmlContent = bookingRejectedTemplate(tenantName, propertyName, checkInDate, checkOutDate, landlord.name, landlord.email, landlord.phone)
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: tenantEmail,
      subject: `Booking Request Declined for "${propertyName}"`,
      html: htmlContent
    })
    
    console.log(`Booking rejected email sent to ${tenantEmail}`)
  } catch (error) {
    console.error('Error sending booking rejected email:', error)
  }
}

module.exports = {
  sendPropertyBookedEmail,
  sendPriceUpdatedEmail,
  sendBookingRequestEmail,
  sendBookingAcceptedEmail,
  sendBookingRejectedEmail,
  sendAppointmentScheduledEmail,
  notifyWishlistOnBooking,
  notifyWishlistOnPriceUpdate
}
