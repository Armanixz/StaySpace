const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAllUsers, deleteUser, getStats } = require('../controllers/adminController');

// All routes below are protected and admin-only

// @route   GET /api/admin/users
router.get('/users', protect, adminOnly, getAllUsers);

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, deleteUser);

// @route   GET /api/admin/stats
router.get('/stats', protect, adminOnly, getStats);

module.exports = router;
