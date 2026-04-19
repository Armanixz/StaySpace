// #chatsystem - Added http and socket.io for real-time chat
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
// #chatsystem - Socket.io setup for real-time messaging
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/properties', require('./routes/property'));
app.use('/api/tenant', require('./routes/tenant'));
app.use('/api/reviews', require('./routes/review'));
// NOTIFICATION FEATURE — Add appointment routes
app.use('/api/appointments', require('./routes/appointment'));
// REPORTING FEATURE — Add report routes
app.use('/api/reports', require('./routes/report'));
// #chatsystem - Chat messaging routes
app.use('/api/chat', require('./routes/chat'));
// STRIPE PAYMENT FEATURE — Payment routes
app.use('/api/payments', require('./routes/payment'));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// #chatsystem - Socket.io event handlers for real-time messaging
const userSockets = new Map(); // #chatsystem - Track connected users for real-time delivery

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // #chatsystem - Store user socket ID when they connect
  socket.on('user-connected', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // #chatsystem - Handle incoming messages and deliver in real-time
  socket.on('send-message', (data) => {
    const { receiverId, senderId, message, messageId } = data;
    const recipientSocketId = userSockets.get(receiverId);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', {
        senderId,
        message,
        messageId,
        timestamp: new Date(),
      });
    }
  });

  // #chatsystem - Cleanup when user disconnects
  socket.on('disconnect', () => {
    // Remove user from userSockets map
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
// #chatsystem - Listen on server (not app) for Socket.io support
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
