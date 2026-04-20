// #chatsystem - Messages page: displays all conversations and chat window
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ChatWindow from '../components/ChatWindow'
import { useAuth } from '../context/AuthContext'
import '../styles/Chat.css'

const Messages = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const landlordId = searchParams.get('landlord')
  const propertyId = searchParams.get('property')
  
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchConversations()
  }, [user])

  useEffect(() => {
    // If landlordId is provided and conversations are loaded, auto-select that conversation
    if (landlordId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find((c) => c.userId === landlordId)
      if (conv) {
        setSelectedConversation(conv)
      } else {
        // Start a new conversation with this landlord
        handleStartNewConversation(landlordId, propertyId)
      }
    } else if (landlordId && conversations.length === 0 && loading === false && !selectedConversation) {
      // If no conversations exist yet, start a new one
      handleStartNewConversation(landlordId, propertyId)
    }
  }, [landlordId, propertyId, conversations, loading])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get('/api/chat/conversations')
      setConversations(data)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err.response?.data?.message || 'Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNewConversation = (userId, propId = null) => {
    // For starting a new conversation with a landlord via query param
    const conversation = {
      userId: userId,
      user: { _id: userId, name: 'Landlord', email: '', role: 'landlord' },
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      property: propId ? { _id: propId, name: '', rent: 0 } : null,
    }
    setSelectedConversation(conversation)
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="messages-container">
          <p>Please login to view messages</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="messages-page">
        <div className="messages-layout">
          {/* Conversations Sidebar */}
          <div className="conversations-sidebar">
            <h2>Messages</h2>
            {loading ? (
              <div className="loading">Loading conversations...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No messages yet</p>
                <small>Start by messaging a landlord from their property listing</small>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.userId}
                    className={`conversation-item ${
                      selectedConversation?.userId === conv.userId ? 'active' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="conversation-header">
                      <h4>{conv.user.name}</h4>
                      {conv.unreadCount > 0 && (
                        <span className="badge">{conv.unreadCount}</span>
                      )}
                    </div>
                    <p className="conversation-preview">{conv.lastMessage}</p>
                    {conv.property && (
                      <p className="conversation-property">{conv.property.name}</p>
                    )}
                    <small className="time">
                      {new Date(conv.lastMessageTime).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Window */}
          <div className="chat-container">
            {selectedConversation ? (
              <ChatWindow
                selectedConversation={selectedConversation}
                onBack={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="chat-empty">
                <h3>Select a conversation to start chatting</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Messages
