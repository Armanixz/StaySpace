// #googleCalendar - Google Calendar OAuth routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAuthUrl, handleCallback } = require('../controllers/calendarController');

// Initiate Google OAuth flow — requires authenticated tenant
router.get('/auth', protect, getAuthUrl);

// Google redirects here after user grants access — public endpoint
router.get('/callback', handleCallback);

module.exports = router;
