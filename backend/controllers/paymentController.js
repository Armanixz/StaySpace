// #paymentGateway - STRIPE PAYMENT FEATURE — Payment processing controller
// Core payment functions: createPaymentIntent, confirmPayment, getPaymentStatus
// #paymentGateway - Stripe payment processing initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Property = require('../models/Property');
const User = require('../models/User');
const Booking = require('../models/Booking');

// #paymentGateway - STRIPE PAYMENT FEATURE — Create payment intent for booking
// Validates property and calculates total amount (nights × pricePerNight)
// Returns clientSecret to frontend for card confirmation
const createPaymentIntent = async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate, pricePerNight } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate || !pricePerNight) {
      return res.status(400).json({ 
        message: 'Please provide property ID, check-in date, check-out date, and price per night' 
      });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Calculate number of nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Calculate total amount in cents
    const totalAmount = Math.round(nights * pricePerNight * 100);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        propertyId: propertyId.toString(),
        tenantId: req.user._id.toString(),
        checkInDate,
        checkOutDate,
        nights,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      nights,
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
};

// #paymentGateway - STRIPE PAYMENT FEATURE — Verify payment succeeded, create booking with payment metadata
// Booking status set to 'pending' so landlord can still accept/reject (existing workflow)
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, propertyId, checkInDate, checkOutDate, pricePerNight } = req.body;

    if (!paymentIntentId || !propertyId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // Retrieve payment intent from Stripe to verify
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeErr) {
      console.error('Stripe retrieve error:', stripeErr);
      return res.status(400).json({ 
        message: 'Invalid payment intent ID', 
        error: stripeErr.message 
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: `Payment failed with status: ${paymentIntent.status}` 
      });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant already has an active booking for this property
    const existingBooking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active booking for this property' });
    }

    // Calculate payment amount
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * pricePerNight;

    // Create booking with payment information
    // STRIPE PAYMENT — Status remains 'pending' so landlord can still accept/reject
    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user._id,
      checkInDate,
      checkOutDate,
      status: 'pending', // Landlord still needs to accept/reject this booking
      paymentId: paymentIntentId,
      paymentStatus: 'completed', // But payment is already completed
      paymentAmount: totalAmount,
      paymentMethod: 'card',
    });

    // Populate the booking after creation
    const populatedBooking = await Booking.findById(booking._id).populate('property').populate('tenant', 'name email');

    // Send confirmation email
    try {
      const { sendBookingRequestEmail } = require('../services/notificationService');
      const tenant = await User.findById(req.user._id);
      const landlord = await User.findById(property.landlord);
      
      await sendBookingRequestEmail(
        tenant.email,
        tenant.name,
        property.name,
        checkInDate,
        checkOutDate,
        { name: landlord.name, email: landlord.email, phone: landlord.phone }
      );
    } catch (emailErr) {
      console.error('Error sending booking email:', emailErr);
      // Don't fail the payment if email fails
    }

    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: populatedBooking,
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
};

// #paymentGateway - Get payment status from Stripe
// @returns payment status (succeeded, requires_action, failed, etc)
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Error fetching payment status:', err);
    res.status(500).json({ message: 'Failed to fetch payment status', error: err.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
};
