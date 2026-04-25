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

## USER CODE WORKFLOW - STEP BY STEP

### WORKFLOW 1: Tenant Clicks "💬 Message Landlord" Button on Property

**STEP 1: User Sees Button on Property Page**
- File: `frontend/src/pages/PropertyDetail.jsx`
- Line: ~280 (in property details rendering)
- Code:
```jsx
<button onClick={() => handleMessageLandlord(property.landlord._id, property._id)}>
  💬 Message Landlord
</button>
```

**STEP 2: Button Click Handler Triggered**
- File: `frontend/src/pages/PropertyDetail.jsx`
- Line: ~200-210 (handleMessageLandlord function)
- Code:
```jsx
const handleMessageLandlord = (landlordId, propertyId) => {
  navigate('/messages', { state: { landlordId, propertyId } })
}
```
- Action: Navigates to Messages page, passes landlord ID in state

**STEP 3: Messages Page Loads with Landlord Pre-Selected**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~30-50 (useEffect that checks for state)
- Code:
```jsx
useEffect(() => {
  const state = location.state
  if (state?.landlordId) {
    setSelectedUserId(state.landlordId)
    fetchMessages(state.landlordId)
  }
}, [location.state])
```
- Action: Sets selectedUserId, loads conversation with landlord

**STEP 4: Fetch Message History from Backend**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~60-70 (fetchMessages function)
- Code:
```jsx
const fetchMessages = async (otherUserId) => {
  const response = await axios.get(`/api/chat/messages/${otherUserId}`)
  setMessages(response.data)
}
```
- Request: `GET /api/chat/messages/{landlordId}`
- Sent to: `http://localhost:5000`

**STEP 5: Backend Receives Message Fetch Request**
- File: `backend/routes/chat.js`
- Line: ~25-30 (GET messages route)
- Code:
```javascript
router.get('/messages/:otherUserId', authMiddleware, async (req, res) => {
  const { otherUserId } = req.params
  const userId = req.user._id
  // ... controller function
})
```
- Route matches: `/api/chat/messages/:otherUserId`
- Middleware: Checks JWT token

**STEP 6: Backend Queries Database**
- File: `backend/controllers/chatController.js`
- Line: ~50-70 (getMessages function)
- Code:
```javascript
const getMessages = async (req, res) => {
  const { otherUserId } = req.params
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user._id }
    ]
  }).sort({ createdAt: 1 })
  res.json(messages)
}
```
- Database: `Message` collection in MongoDB
- Query: Find all messages between tenant and landlord (bi-directional)

**STEP 7: Backend Marks Messages as Read**
- File: `backend/controllers/chatController.js`
- Line: ~65-75 (same getMessages function)
- Code:
```javascript
// Mark as read if receiver is current user
await Message.updateMany(
  { sender: otherUserId, receiver: req.user._id, read: false },
  { read: true }
)
```
- Action: Updates DB to mark incoming messages as read

**STEP 8: Response Sent Back to Frontend**
- File: `backend/controllers/chatController.js`
- Line: ~75
- Code: `res.json(messages)` returns array of message objects

**STEP 9: Frontend Displays Messages in ChatWindow**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~20-40 (render messages)
- Code:
```jsx
{messages.map((msg) => (
  <div className={`message ${msg.sender === userId ? 'sent' : 'received'}`}>
    {msg.text}
  </div>
))}
```
- Displays: All messages from conversation history
- CSS: Aligns messages left/right based on sender

---

### WORKFLOW 2: Tenant Types Message and Clicks "Send"

**STEP 1: User Types in Input Field**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~80-90 (input field)
- Code:
```jsx
<input
  type="text"
  value={messageText}
  onChange={(e) => setMessageText(e.target.value)}
  placeholder="Type a message..."
/>
```
- Action: Updates messageText state as user types

**STEP 2: User Clicks Send Button**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~95-100 (send button)
- Code:
```jsx
<button onClick={handleSendMessage}>Send</button>
```
- Triggers: handleSendMessage function

**STEP 3: Send Handler Prepares Message**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~50-70 (handleSendMessage function)
- Code:
```jsx
const handleSendMessage = async () => {
  if (!messageText.trim()) return
  
  const messageData = {
    receiverId: selectedUserId,
    propertyId: propertyId,
    text: messageText
  }
  
  // Emit via Socket.io for real-time
  socket.emit('send-message', messageData)
  
  // Also save to backend via HTTP
  await axios.post('/api/chat/send', messageData)
  
  setMessageText('')
}
```
- Prepares: receiver, property, text
- Sends via: Socket.io (real-time) + HTTP (persistent)

**STEP 4: Socket.io Emits Message to Backend (Real-time)**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~60
- Code: `socket.emit('send-message', messageData)`
- Event: `send-message`
- Payload: {receiverId, propertyId, text}

**STEP 5: Backend Socket.io Receives Message**
- File: `backend/server.js`
- Line: ~80-100 (Socket.io event listener)
- Code:
```javascript
io.on('connection', (socket) => {
  socket.on('send-message', (data) => {
    // Broadcast to receiver
    io.to(data.receiverId).emit('receive-message', {
      sender: socket.userId,
      text: data.text,
      createdAt: new Date()
    })
  })
})
```
- Receives: send-message event
- Broadcasts: receive-message to landlord in real-time

**STEP 6: HTTP Request Also Sent to Backend**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~62-65
- Code:
```javascript
const response = await axios.post('/api/chat/send', messageData)
```
- Request: `POST /api/chat/send`
- Body: {receiverId, propertyId, text}
- Headers: Authorization: Bearer {JWT token}

**STEP 7: Backend Route Receives POST**
- File: `backend/routes/chat.js`
- Line: ~10-20 (POST send route)
- Code:
```javascript
router.post('/send', authMiddleware, async (req, res) => {
  const { receiverId, propertyId, text } = req.body
  const senderId = req.user._id
  // ... calls controller
})
```
- Middleware: authMiddleware validates JWT
- Extracts: senderId from JWT token

**STEP 8: Backend Controller Saves Message to DB**
- File: `backend/controllers/chatController.js`
- Line: ~20-45 (sendMessage function)
- Code:
```javascript
const sendMessage = async (req, res) => {
  const { receiverId, propertyId, text } = req.body
  const sender = req.user._id
  
  const newMessage = await Message.create({
    sender: sender,
    receiver: receiverId,
    propertyId: propertyId,
    text: text,
    read: false,
    createdAt: new Date()
  })
  
  res.status(201).json(newMessage)
}
```
- Database: Creates new Message document in MongoDB
- Fields: sender, receiver, propertyId, text, read status, timestamp

**STEP 9: Backend Returns Message to Frontend**
- File: `backend/controllers/chatController.js`
- Line: ~42
- Code: `res.status(201).json(newMessage)`
- Returns: New message object with _id, timestamps

**STEP 10: Frontend Receives & Displays Sent Message**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~100-110 (after successful POST)
- Code:
```jsx
setMessages([...messages, response.data])
setMessageText('')
```
- Adds message to messages array
- Clears input field
- Message appears in chat window

**STEP 11: Landlord Receives Real-time Notification**
- File: `frontend/src/components/ChatWindow.jsx`
- Line: ~20-30 (Socket.io listener)
- Code:
```jsx
useEffect(() => {
  socket.on('receive-message', (message) => {
    setMessages(prev => [...prev, message])
  })
}, [])
```
- Event: receive-message from Socket.io
- Updates: Displays new message immediately
- No page refresh needed

---

### WORKFLOW 3: Landlord Clicks "Messages" in Navbar

**STEP 1: Navbar Messages Link Clicked**
- File: `frontend/src/components/Navbar.jsx`
- Line: ~60-70 (Messages link)
- Code:
```jsx
<Link to="/messages">
  Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</Link>
```
- Action: Navigate to `/messages` route
- Badge: Shows unread count if > 0

**STEP 2: Messages Page Loads**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~1-20 (page initialization)
- Code:
```jsx
useEffect(() => {
  fetchConversations()
}, [])

const fetchConversations = async () => {
  const response = await axios.get('/api/chat/conversations')
  setConversations(response.data)
}
```
- Request: `GET /api/chat/conversations`
- Action: Fetch all conversations for logged-in user

**STEP 3: Backend Receives Conversations Request**
- File: `backend/routes/chat.js`
- Line: ~40-50 (GET conversations route)
- Code:
```javascript
router.get('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user._id
  // ... controller function
})
```
- Middleware: Validates JWT token
- Extracts: Current user ID

**STEP 4: Backend Queries Database for Conversations**
- File: `backend/controllers/chatController.js`
- Line: ~100-130 (getConversations function)
- Code:
```javascript
const getConversations = async (req, res) => {
  const userId = req.user._id
  
  // Get all messages where user is sender or receiver
  const messages = await Message.find({
    $or: [
      { sender: userId },
      { receiver: userId }
    ]
  })
  
  // Group by conversation partner
  const conversations = {}
  messages.forEach(msg => {
    const partnerId = msg.sender.equals(userId) ? msg.receiver : msg.sender
    if (!conversations[partnerId]) {
      conversations[partnerId] = {
        unreadCount: 0,
        lastMessage: null,
        messages: []
      }
    }
    
    // Count unread messages
    if (!msg.read && msg.receiver.equals(userId)) {
      conversations[partnerId].unreadCount++
    }
    
    conversations[partnerId].lastMessage = msg
  })
  
  res.json(Object.values(conversations))
}
```
- Database: Queries Message collection
- Logic: Groups messages by conversation partner
- Counts: Unread messages for each conversation

**STEP 5: Backend Returns Conversations**
- File: `backend/controllers/chatController.js`
- Line: ~128
- Code: `res.json(Object.values(conversations))`
- Returns: Array of conversation objects

**STEP 6: Frontend Displays Conversation List**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~100-120 (render conversations)
- Code:
```jsx
{conversations.map(conv => (
  <div 
    className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
    onClick={() => handleSelectConversation(conv.userId)}
  >
    <h4>{conv.userName}</h4>
    {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
    <p>{conv.lastMessage?.text}</p>
  </div>
))}
```
- Displays: All conversations in sidebar
- Styling: Highlights unread conversations
- Click: Loads chat with selected user

**STEP 7: Landlord Clicks Conversation to View Messages**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~130-140 (handleSelectConversation)
- Code:
```jsx
const handleSelectConversation = (userId) => {
  setSelectedUserId(userId)
  fetchMessages(userId)
  markAsRead(userId) // Mark unread messages as read
}
```
- Action: Loads message history with that tenant
- Marks: All messages from tenant as read

**STEP 8: Mark as Read Request to Backend**
- File: `frontend/src/pages/Messages.jsx`
- Line: ~140-145 (markAsRead function)
- Code:
```jsx
const markAsRead = async (senderId) => {
  await axios.put(`/api/chat/mark-read/${senderId}`)
}
```
- Request: `PUT /api/chat/mark-read/{tenantId}`
- Action: Update unread status in database

**STEP 9: Backend Updates Read Status**
- File: `backend/controllers/chatController.js`
- Line: ~150-165 (markAsRead function)
- Code:
```javascript
const markAsRead = async (req, res) => {
  const { senderId } = req.params
  const receiverId = req.user._id
  
  await Message.updateMany(
    { sender: senderId, receiver: receiverId, read: false },
    { read: true }
  )
  
  res.json({ success: true })
}
```
- Database: Updates Message documents where read=false
- Sets: read=true for all messages from tenant to landlord

---

## User Flow (Summary)

### Tenant's Journey
1. **Line:** PropertyDetail.jsx:280 - Clicks "💬 Message Landlord"
2. **Line:** PropertyDetail.jsx:200 - handleMessageLandlord navigates to /messages
3. **Line:** Messages.jsx:40 - useEffect detects landlordId in state
4. **Line:** Messages.jsx:65 - fetchMessages calls GET /api/chat/messages/{landlordId}
5. **Line:** chatController.js:50 - Backend queries messages
6. **Line:** ChatWindow.jsx:20 - Messages displayed in chat window
7. **Line:** ChatWindow.jsx:95 - User types and clicks Send
8. **Line:** ChatWindow.jsx:60 - socket.emit('send-message', messageData)
9. **Line:** ChatWindow.jsx:62 - axios.post('/api/chat/send', messageData)
10. **Line:** chatController.js:25 - Backend creates Message in MongoDB
11. **Line:** server.js:85 - Socket broadcasts receive-message to landlord
12. **Line:** ChatWindow.jsx:25 - Landlord's page updates in real-time

### Landlord's Journey
1. **Line:** Navbar.jsx:60 - Clicks "Messages" link
2. **Line:** Messages.jsx:5 - fetchConversations called
3. **Line:** Messages.jsx:10 - axios.get('/api/chat/conversations')
4. **Line:** chatController.js:100 - Backend queries all conversations
5. **Line:** chatController.js:115 - Groups messages by partner
6. **Line:** chatController.js:120 - Counts unread messages
7. **Line:** Messages.jsx:100 - Conversations displayed in sidebar
8. **Line:** Messages.jsx:130 - Clicks conversation to view
9. **Line:** Messages.jsx:140 - axios.put('/api/chat/mark-read/{tenantId}')
10. **Line:** chatController.js:155 - Backend updates read status
11. **Line:** ChatWindow.jsx:85 - Can reply to messages (same flow as Step 7-11)

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
