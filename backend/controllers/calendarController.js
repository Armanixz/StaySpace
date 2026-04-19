// #googleCalendar - Google Calendar OAuth 2.0 controller
// Handles OAuth URL generation and callback to create checkout events
const { google } = require('googleapis');
const Booking = require('../models/Booking');

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// #googleCalendar - Return Google OAuth URL as JSON so the frontend can redirect
// Browser navigations don't carry Authorization headers, so we return the URL
// and let the authenticated axios call handle the auth check
const getAuthUrl = (req, res) => {
  const { bookingId } = req.query;

  if (!bookingId) {
    return res.status(400).json({ message: 'bookingId is required' });
  }

  const oauth2Client = createOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: bookingId,
  });

  res.json({ authUrl });
};

// #googleCalendar - Exchange OAuth code for tokens and create calendar event
// Called by Google after user grants calendar access
const handleCallback = async (req, res) => {
  const { code, state: bookingId } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!code || !bookingId) {
    return res.redirect(`${clientUrl}?calendarError=true`);
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch booking to get checkout date and property name
    const booking = await Booking.findById(bookingId).populate('property', 'name');
    if (!booking) {
      return res.redirect(`${clientUrl}?calendarError=true`);
    }

    const checkOut = new Date(booking.checkOutDate);
    const checkIn = new Date(booking.checkInDate);

    // Format dates as YYYY-MM-DD for all-day events
    const checkOutStr = checkOut.toISOString().split('T')[0];
    const dayAfterCheckout = new Date(checkOut);
    dayAfterCheckout.setDate(dayAfterCheckout.getDate() + 1);
    const dayAfterStr = dayAfterCheckout.toISOString().split('T')[0];

    const checkInFormatted = checkIn.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const checkOutFormatted = checkOut.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Room Booking Checkout - ${booking.property.name}`,
        description: `Check out from ${booking.property.name}.\nCheck-in: ${checkInFormatted}\nCheck-out: ${checkOutFormatted}`,
        start: { date: checkOutStr },
        end: { date: dayAfterStr },
        reminders: { useDefault: true },
      },
    });

    res.redirect(`${clientUrl}?calendarSuccess=true`);
  } catch (err) {
    console.error('Google Calendar error:', err.message);
    res.redirect(`${clientUrl}?calendarError=true`);
  }
};

module.exports = { getAuthUrl, handleCallback };
