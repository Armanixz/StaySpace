const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProperties,
  getPropertyById,
  createProperty,
  getMyListings,
  deleteProperty,
  updateProperty,
} = require('../controllers/propertyController');

/**
 * Arman
 * Property routes — mounted at /api/properties in server.js
 *   landlordOnly middleware: allows landlords and admins, blocks tenants
 *   GET  /            → public, all listings (with optional search)
 *   GET  /my          → landlord's own listings
 *   POST /            → create a new listing
 *   DELETE /:id       → delete own listing by ID
 */
const landlordOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'landlord' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Landlords only' });
};

// @route   GET /api/properties
router.get('/', getProperties);

// @route   GET /api/properties/my
router.get('/my', protect, landlordOnly, getMyListings);

// @route   GET /api/properties/:id (must come after /my)
router.get('/:id', getPropertyById);

// @route   POST /api/properties
router.post('/', protect, landlordOnly, createProperty);

// NOTIFICATION FEATURE — Update property (triggers price update notifications)
// @route   PUT /api/properties/:id
router.put('/:id', protect, landlordOnly, updateProperty);

// @route   DELETE /api/properties/:id
router.delete('/:id', protect, landlordOnly, deleteProperty);

module.exports = router;
