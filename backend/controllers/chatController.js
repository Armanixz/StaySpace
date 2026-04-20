// #chatsystem - Chat controller for real-time messaging
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * #chatsystem - Chat Controller — handles all messaging operations
 * Ensures only tenant-landlord conversations are allowed
 * Methods: sendMessage, getConversations, getMessages, markMessagesAsRead
 */

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, propertyId, text } = req.body;
    const senderId = req.user.id;

    // Validation
    if (!receiverId || !text) {
      return res.status(400).json({ message: 'Receiver and message text are required' });
    }

    // Get both users to verify roles
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure tenant-landlord only (not tenant-tenant or landlord-landlord)
    const isValidConversation =
      (sender.role === 'tenant' && receiver.role === 'landlord') ||
      (sender.role === 'landlord' && receiver.role === 'tenant');

    if (!isValidConversation) {
      return res.status(403).json({
        message: 'Only tenants and landlords can chat with each other',
      });
    }

    // Create and save message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      propertyId: propertyId || null,
      text,
    });

    await message.save();
    await message.populate('sender', 'name email phone role');
    await message.populate('receiver', 'name email phone role');

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get all conversations for a user (unique conversations with latest message)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('propertyId', 'name rent')
      .sort({ createdAt: -1 });

    // Group conversations by the other user
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUserId =
        msg.sender._id.toString() === userId ? msg.receiver._id : msg.sender._id;
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(otherUserId.toString())) {
        conversationsMap.set(otherUserId.toString(), {
          userId: otherUserId,
          user: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role,
          },
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          property: msg.propertyId || null,
        });
      }

      // Count unread messages from this conversation
      if (msg.receiver._id.toString() === userId && !msg.read) {
        const conv = conversationsMap.get(otherUserId.toString());
        conv.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('propertyId', 'name rent')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        sender: senderId,
        receiver: userId,
        read: false,
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};
