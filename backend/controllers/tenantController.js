const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
// NOTIFICATION FEATURE — Import notification service for email alerts
const { sendBookingRequestEmail, sendBookingAcceptedEmail, sendBookingRejectedEmail, notifyWishlistOnBooking } = require('../services/notificationService');
// REPORTING FEATURE — Import Report model
const Report = require('../models/Report');


const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tenant: req.user._id })
      .populate('property')
      .populate('tenant', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Please provide property, check-in and check-out dates' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant has already booked this property (non-cancelled booking)
    const existingBooking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You have already booked this property' });
    }

    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user._id,
      checkInDate,
      checkOutDate,
    });

    const populatedBooking = await booking.populate('property');
    
    // NOTIFICATION FEATURE — Send booking request email to tenant with landlord contact info
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
    
    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    const populatedBooking = await booking.populate('property');
    res.json(populatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLandlordBookings = async (req, res) => {
  try {
    // Get all properties owned by this landlord
    const properties = await Property.find({ landlord: req.user._id });
    const propertyIds = properties.map(p => p._id);

    // Get all bookings for these properties
    const bookings = await Booking.find({ property: { $in: propertyIds } })
      .populate('property')
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });

    // REPORTING FEATURE — Fetch reports for each tenant in the bookings
    const bookingsWithReports = await Promise.all(
      bookings.map(async (booking) => {
        const tenantReports = await Report.find({
          reportedUser: booking.tenant._id,
          reportType: 'landlord-to-tenant',
        })
          .populate('reporter', 'name')
          .sort({ createdAt: -1 });

        return {
          ...booking.toObject(),
          tenantReports,
        };
      })
    );

    res.json(bookingsWithReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Confirm a booking
// @route   PUT /api/landlord/bookings/:id/confirm
// @access  Private (Landlord)
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('property');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the property belongs to this landlord
    if (booking.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'confirmed';
    await booking.save();
    
    const populatedBooking = await booking.populate('tenant', 'name email phone');
    
    // NOTIFICATION FEATURE — Send booking acceptance email to tenant with landlord contact info
    const tenant = await User.findById(booking.tenant._id);
    const property = await Property.findById(booking.property._id);
    const landlord = await User.findById(req.user._id);
    await sendBookingAcceptedEmail(
      tenant.email,
      tenant.name,
      property.name,
      booking.checkInDate,
      booking.checkOutDate,
      { name: landlord.name, email: landlord.email, phone: landlord.phone }
    );
    
    // NOTIFICATION FEATURE — Notify all other tenants with wishlisted property about the booking with dates
    await notifyWishlistOnBooking(
      booking.property._id,
      booking.checkInDate,
      booking.checkOutDate,
      booking.tenant._id
    );
    
    res.json(populatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('property').populate('tenant');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the property belongs to this landlord
    if (booking.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    // NOTIFICATION FEATURE — Send booking rejection email to tenant with landlord contact info
    const tenant = booking.tenant;
    const property = booking.property;
    const landlord = await User.findById(req.user._id);
    await sendBookingRejectedEmail(
      tenant.email,
      tenant.name,
      property.name,
      booking.checkInDate,
      booking.checkOutDate,
      { name: landlord.name, email: landlord.email, phone: landlord.phone }
    );
    
    const populatedBooking = await booking.populate('tenant', 'name email phone');
    res.json(populatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const addToWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already in wishlist
    if (user.wishlist.includes(propertyId)) {
      return res.status(400).json({ message: 'Property already in wishlist' });
    }

    user.wishlist.push(propertyId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json(updatedUser.wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== propertyId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json(updatedUser.wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyBookings,
  createBooking,
  cancelBooking,
  getLandlordBookings,
  confirmBooking,
  rejectBooking,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
