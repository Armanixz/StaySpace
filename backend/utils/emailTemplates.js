// NOTIFICATION FEATURE — Email templates for different notification types

// NOTIFICATION FEATURE — Template when wishlisted property gets booked
const propertyBookedTemplate = (tenantName, propertyName, checkInDate, checkOutDate) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Property Unavailable Notification</h2>
          <p>Hi ${tenantName},</p>
          <p>Your wishlisted property <strong>${propertyName}</strong> will be unavailable from <strong>${new Date(checkInDate).toLocaleDateString()}</strong> to <strong>${new Date(checkOutDate).toLocaleDateString()}</strong>.</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #FFA500; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-weight: 600;">The property is currently booked for this period. Book it quickly before it becomes unavailable for other dates too!</p>
          </div>
          
          <p>Visit our website to explore other dates or similar properties.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

// NOTIFICATION FEATURE — Template when price of wishlisted property is updated
const priceUpdatedTemplate = (tenantName, propertyName, oldPrice, newPrice, landlordName, landlordEmail, landlordPhone) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Price Update Notification</h2>
          <p>Hi ${tenantName},</p>
          <p>The rent for your wishlisted property <strong>${propertyName}</strong> has been updated!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FFA500; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Previous Price:</strong> ৳${oldPrice.toLocaleString()}/month</p>
            <p style="margin: 5px 0;"><strong>New Price:</strong> ৳${newPrice.toLocaleString()}/month</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Landlord Contact Information:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${landlordName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${landlordEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${landlordPhone}</p>
          </div>
          
          <p>Check your wishlist to view the updated details.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

// NOTIFICATION FEATURE — Template when booking request is received
const bookingRequestTemplate = (tenantName, propertyName, checkInDate, checkOutDate, landlordName, landlordEmail, landlordPhone) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Booking Request Notification</h2>
          <p>Hi ${tenantName},</p>
          <p>Your booking request for <strong>${propertyName}</strong> has been received!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Landlord Contact Information:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${landlordName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${landlordEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${landlordPhone}</p>
          </div>
          
          <p>The landlord will review your request shortly. You can also contact them directly if needed.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

// NOTIFICATION FEATURE — Template when booking is accepted by landlord
const bookingAcceptedTemplate = (tenantName, propertyName, checkInDate, checkOutDate, landlordName, landlordEmail, landlordPhone) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">✓ Booking Confirmed!</h2>
          <p>Hi ${tenantName},</p>
          <p>Great news! Your booking for <strong>${propertyName}</strong> has been accepted!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Landlord Contact Information:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${landlordName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${landlordEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${landlordPhone}</p>
          </div>
          
          <p>Please contact the landlord for further details and check-in arrangements.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

// NOTIFICATION FEATURE — Template when appointment is scheduled
const appointmentScheduledTemplate = (tenantName, propertyName, appointmentDate, appointmentTime, landlordName, landlordEmail, landlordPhone) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Appointment Scheduled</h2>
          <p>Hi ${tenantName},</p>
          <p>Your appointment for <strong>${propertyName}</strong> has been scheduled!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Landlord Contact Information:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${landlordName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${landlordEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${landlordPhone}</p>
          </div>
          
          <p>Please save this information and reach out to the landlord if you need to reschedule.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

// NOTIFICATION FEATURE — Template when booking request is rejected
const bookingRejectedTemplate = (tenantName, propertyName, checkInDate, checkOutDate, landlordName, landlordEmail, landlordPhone) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Booking Request Declined</h2>
          <p>Hi ${tenantName},</p>
          <p>Unfortunately, your booking request for <strong>${propertyName}</strong> has been declined.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FFA500; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Landlord Contact Information:</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${landlordName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${landlordEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${landlordPhone}</p>
          </div>
          
          <p>Feel free to reach out to the landlord directly to discuss alternative dates or properties.</p>
          <p>Best regards,<br/>StaySpace Team</p>
        </div>
      </body>
    </html>
  `
}

module.exports = {
  propertyBookedTemplate,
  priceUpdatedTemplate,
  bookingRequestTemplate,
  bookingAcceptedTemplate,
  appointmentScheduledTemplate,
  bookingRejectedTemplate
}
