const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReview,
  getPropertyReviews,
  deleteReview,
} = require('../controllers/reviewController');


const tenantOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'tenant' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Tenants only' });
};

// @route   POST /api/reviews
router.post('/', protect, tenantOnly, createReview);

// @route   GET /api/reviews/:propertyId
router.get('/:propertyId', getPropertyReviews);

// @route   DELETE /api/reviews/:id
router.delete('/:id', protect, tenantOnly, deleteReview);

module.exports = router;
