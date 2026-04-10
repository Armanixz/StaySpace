const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyBookings,
  createBooking,
  cancelBooking,
  getLandlordBookings,
  confirmBooking,
  rejectBooking,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/tenantController');

// Tenant-only middleware
const tenantOnly = (req, res, next) => {
  if (req.user && req.user.role === 'tenant') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Tenants only' });
};

// Landlord-only middleware
const landlordOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'landlord' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Landlords only' });
};

// Booking routes
// @route   GET /api/tenant/bookings
router.get('/bookings', protect, tenantOnly, getMyBookings);

// @route   POST /api/tenant/bookings
router.post('/bookings', protect, tenantOnly, createBooking);

// @route   PUT /api/tenant/bookings/:id/cancel
router.put('/bookings/:id/cancel', protect, tenantOnly, cancelBooking);

// Landlord booking management routes
// @route   GET /api/tenant/landlord/bookings
router.get('/landlord/bookings', protect, landlordOnly, getLandlordBookings);

// @route   PUT /api/tenant/landlord/bookings/:id/confirm
router.put('/landlord/bookings/:id/confirm', protect, landlordOnly, confirmBooking);

// @route   PUT /api/tenant/landlord/bookings/:id/reject
router.put('/landlord/bookings/:id/reject', protect, landlordOnly, rejectBooking);

// Wishlist routes
// @route   GET /api/tenant/wishlist
router.get('/wishlist', protect, tenantOnly, getWishlist);

// @route   POST /api/tenant/wishlist/:propertyId
router.post('/wishlist/:propertyId', protect, tenantOnly, addToWishlist);

// @route   DELETE /api/tenant/wishlist/:propertyId
router.delete('/wishlist/:propertyId', protect, tenantOnly, removeFromWishlist);

module.exports = router;
