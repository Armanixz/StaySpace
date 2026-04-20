# StaySpace Chat System - Implementation Guide

## Overview
A real-time, in-app chat system that enables tenant-landlord conversations with message history and unread notifications.

## Features Implemented
✅ Real-time messaging using Socket.io
✅ One-to-one conversations (tenant ↔ landlord only)
✅ Message history persistence
✅ Unread message counter
✅ Auto-scroll to latest messages
✅ Messages page with conversation list
✅ "Message Landlord" button on property details
✅ "Messages" navigation link
✅ Minimal, clean UI matching your color palette

## Color Palette Used
- Primary Dark: #1B211A
- Primary Green: #628141  
- Light Green: #8BAE66
- Cream/Beige: #EBD5AB

## Installation Steps

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

For frontend, optionally create `.env`:
```
VITE_API_URL=http://localhost:5000
```

### 3. Start the Application
```bash
# Terminal 1 - Backend (with Socket.io)
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Database Schema

### Message Model
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  propertyId: ObjectId (ref: Property) [optional],
  text: String,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Chat Routes (All require authentication)

**POST** `/api/chat/send`
- Send a message to another user
- Body: `{ receiverId, propertyId (optional), text }`

**GET** `/api/chat/conversations`
- Get all conversations for the current user
- Returns: Array of conversations with unread counts and latest message

**GET** `/api/chat/messages/:otherUserId`
- Get all messages with a specific user
- Returns: Array of messages sorted by date

**PUT** `/api/chat/mark-read/:senderId`
- Mark all unread messages from a sender as read

## User Flow

### Tenant's Journey
1. Tenant views a property listing
2. Clicks "💬 Message Landlord" button
3. Redirected to Messages page with landlord pre-selected
4. Can view message history or start typing
5. Messages appear in real-time
6. Can view all conversations from "Messages" in navbar
7. Unread message count shows on each conversation

### Landlord's Journey
1. Landlord clicks "Messages" in navbar
2. Views all conversations with tenants who messaged them
3. Can reply to messages
4. Each conversation shows property info if available

## Frontend Components

### Messages.jsx (`/messages`)
- Main messages page
- Displays conversation list on left
- Chat window on right
- Auto-selects landlord if redirected from property page

### ChatWindow.jsx
- Individual chat interface
- Real-time message updates via Socket.io
- Message input form
- Back button to conversation list
- Auto-scroll to latest message

**Socket.io Integration**
- Event: `user-connected` - User connects to chat
- Event: `send-message` - Emit when sending a message
- Event: `receive-message` - Listen for incoming messages

## Authentication
- All chat endpoints require JWT token in Authorization header
- Format: `Authorization: Bearer <token>`
- Tenant-landlord restriction enforced at controller level

## Styling Classes

### Chat Specific Classes
- `.messages-page` - Main chat page container
- `.conversations-sidebar` - Left sidebar with conversation list
- `.conversation-item` - Individual conversation item
- `.chat-window` - Chat interface
- `.chat-messages` - Message display area
- `.message` - Individual message
- `.message.sent` / `.message.received` - Message positioning
- `.chat-input-form` - Message input area
- `.btn-message` - Message button styling

## Known Limitations & Future Improvements

### Current
- No typing indicators
- No message read receipts
- No message editing/deletion
- No image/file sharing
- No group chats
- Socket connection not authenticated (uses user ID sent from client)

### Recommended Improvements
1. Add middleware to validate socket connections with JWT
2. Implement message read receipts
3. Add typing indicators
4. Enable message deletion/editing
5. Add conversation search
6. Add conversation archive
7. Implement message reactions/emoji
8. Add file/image sharing capabilities

## Troubleshooting

### Socket Connection Issues
- Ensure `CLIENT_URL` env var matches your frontend URL
- Check that backend is running on port 5000
- Verify CORS is enabled in Socket.io configuration

### Messages Not Sending
- Check browser console for errors
- Verify JWT token is valid
- Ensure receiver ID is correct and user exists
- Check that sender and receiver have correct roles (tenant & landlord)

### No Real-time Updates
- Verify Socket.io connection is established (check Network tab)
- Check that `user-connected` event is being emitted
- Verify both clients are connected to same Socket server

## Testing the Chat System

1. **Create two test users:**
   - Landlord (email: landlord@test.com, role: landlord)
   - Tenant (email: tenant@test.com, role: tenant)

2. **Create a property** as landlord

3. **As tenant:**
   - Login as tenant
   - Navigate to the property
   - Click "Message Landlord"
   - Type and send a message

4. **As landlord:**
   - Login as landlord
   - Click "Messages" in navbar
   - You should see the tenant's conversation
   - Reply to the message

5. **Verify features:**
   - ✓ Real-time message delivery
   - ✓ Message history persists
   - ✓ Unread counts update
   - ✓ Both users can see the conversation

## File Structure Summary

```
backend/
  ├── models/
  │   └── Message.js (NEW)
  ├── controllers/
  │   └── chatController.js (NEW)
  ├── routes/
  │   └── chat.js (NEW)
  └── server.js (UPDATED)

frontend/
  ├── src/
  │   ├── pages/
  │   │   └── Messages.jsx (NEW)
  │   ├── components/
  │   │   └── ChatWindow.jsx (NEW)
  │   ├── styles/
  │   │   └── Chat.css (NEW)
  │   ├── App.jsx (UPDATED)
  │   ├── index.css (UPDATED)
  │   └── components/
  │       ├── Navbar.jsx (UPDATED)
  │       └── PropertyDetail.jsx (UPDATED)
  └── package.json (UPDATED)
```

## Next Steps
1. Install dependencies in both frontend and backend
2. Configure environment variables
3. Run migrations if any
4. Start backend and frontend servers
5. Test the complete chat flow
6. Deploy to production

---
**Feature Status:** ✅ Complete and Ready for Testing
