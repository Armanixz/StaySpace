// #paymentGateway - STRIPE PAYMENT FEATURE — Payment routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');

// Tenant-only middleware
const tenantOnly = (req, res, next) => {
  if (req.user && req.user.role === 'tenant') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Tenants only' });
};

// #paymentGateway - STRIPE PAYMENT FEATURE — Create payment intent
// @route   POST /api/payments/create-intent
router.post('/create-intent', protect, tenantOnly, createPaymentIntent);

// #paymentGateway - STRIPE PAYMENT FEATURE — Confirm payment and create booking
// @route   POST /api/payments/confirm
router.post('/confirm', protect, tenantOnly, confirmPayment);

// #paymentGateway - STRIPE PAYMENT FEATURE — Get payment status
// @route   GET /api/payments/:paymentIntentId/status
router.get('/:paymentIntentId/status', protect, tenantOnly, getPaymentStatus);

module.exports = router;
