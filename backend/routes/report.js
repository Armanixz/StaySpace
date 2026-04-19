const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  reportLandlord,
  reportTenant,
  getReportsAboutUser,
  getReportsByUser,
  deleteReport,
} = require('../controllers/reportController');

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

// @route   POST /api/reports/landlord/:landlordId
// @desc    Tenant reports a landlord
// @access  Private (Tenant)
router.post('/landlord/:landlordId', protect, tenantOnly, reportLandlord);

// @route   POST /api/reports/tenant/:tenantId
// @desc    Landlord reports a tenant
// @access  Private (Landlord)
router.post('/tenant/:tenantId', protect, landlordOnly, reportTenant);

// @route   GET /api/reports/by/:userId
// @desc    Get reports filed by a user
// @access  Private
// Place this BEFORE the /:userId route to avoid route collision
router.get('/by/:userId', protect, getReportsByUser);

// @route   GET /api/reports/:userId
// @desc    Get all reports against a user
// @access  Private
router.get('/:userId', protect, getReportsAboutUser);

// @route   DELETE /api/reports/:reportId
// @desc    Delete a report
// @access  Private (Reporter or Admin)
router.delete('/:reportId', protect, deleteReport);

module.exports = router;
