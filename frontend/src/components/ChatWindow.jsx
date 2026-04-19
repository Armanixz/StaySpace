// #chatsystem - Chat window component: displays messages and handles real-time chat
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import '../styles/Chat.css'

const ChatWindow = ({ selectedConversation, onBack }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      socketRef.current.on('connect', () => {
        console.log('Connected to socket server')
        socketRef.current.emit('user-connected', user._id)
      })

      socketRef.current.on('receive-message', (data) => {
        setMessages((prev) => [
          ...prev,
          {
            _id: data.messageId,
            sender: { _id: data.senderId },
            text: data.message,
            createdAt: data.timestamp,
          },
        ])
      })
    }

    // Fetch messages for this conversation
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(
          `/api/chat/messages/${selectedConversation.userId}`
        )
        setMessages(data)

        // Mark messages as read
        await axios.put(
          `/api/chat/mark-read/${selectedConversation.userId}`,
          {}
        )
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [selectedConversation.userId, user._id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      setSending(true)
      
      const { data } = await axios.post(
        '/api/chat/send',
        {
          receiverId: selectedConversation.userId,
          text: newMessage,
          propertyId: selectedConversation.property?._id || null,
        }
      )

      setMessages((prev) => [...prev, data])
      setNewMessage('')

      // Emit through socket for real-time delivery
      socketRef.current?.emit('send-message', {
        receiverId: selectedConversation.userId,
        senderId: user._id,
        message: newMessage,
        messageId: data._id,
      })
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <div className="chat-info">
          <h3>{selectedConversation.user.name}</h3>
          {selectedConversation.property && (
            <p className="chat-property">
              {selectedConversation.property.name} • ${selectedConversation.property.rent}
            </p>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="loading-chat">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${msg.sender._id === user._id ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()} className="btn-send">
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
