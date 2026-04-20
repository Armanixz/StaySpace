// #chatsystem - Chat API routes for real-time messaging
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
} = require('../controllers/chatController');

const router = express.Router();

/**
 * #chatsystem - Chat routes — all require authentication
 * Only tenant-landlord conversations allowed
 * Endpoints: POST /send, GET /conversations, GET /messages/:otherUserId, PUT /mark-read/:senderId
 */

// POST /api/chat/send — Send a message
router.post('/send', protect, sendMessage);

// GET /api/chat/conversations — Get all conversations for current user
router.get('/conversations', protect, getConversations);

// GET /api/chat/messages/:otherUserId — Get messages with specific user
router.get('/messages/:otherUserId', protect, getMessages);

// PUT /api/chat/mark-read/:senderId — Mark messages as read
router.put('/mark-read/:senderId', protect, markMessagesAsRead);

module.exports = router;
