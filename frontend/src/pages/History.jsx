import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const History = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent or oldest

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'tenant') {
      navigate('/')
      return
    }

    fetchHistory()
  }, [user, navigate])

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/api/tenant/history')
      setHistory(data)
    } catch (err) {
      setError('Failed to load history')
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all your browsing history? This action cannot be undone.')) return

    try {
      await axios.delete('/api/tenant/history')
      setHistory([])
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear history')
      console.error('Error clearing history:', err)
    }
  }

  const handleRemoveFromHistory = async (propertyId) => {
    if (!window.confirm('Remove this property from your history?')) return

    try {
      // Find the history record by property ID
      const historyRecord = history.find((h) => h.property?._id === propertyId)
      if (!historyRecord) {
        setError('History record not found')
        return
      }
      
      await axios.delete(`/api/tenant/history/${historyRecord._id}`)
      setHistory((prev) => prev.filter((h) => h.property?._id !== propertyId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from history')
      console.error('Error removing from history:', err)
    }
  }

  const getSortedHistory = () => {
    const sorted = [...history]
    if (sortBy === 'recent') {
      return sorted.reverse()
    }
    return sorted
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>Loading your browsing history...</p>
        </div>
      </div>
    )
  }

  const sortedHistory = getSortedHistory()

  return (
    <div>
      <Navbar />
      <div className="history-page">
        <div className="history-header">
          <h1>Browsing History</h1>
          <p className="history-count">{history.length} properties viewed</p>
        </div>

        <div className="container">
          {error && <div className="error-message">{error}</div>}

          {history.length === 0 ? (
            <div className="empty-state">
              <p>Your browsing history is empty. Start exploring properties!</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Browse Properties
              </Link>
            </div>
          ) : (
            <>
              <div className="history-controls">
                <div className="sort-controls">
                  <label htmlFor="sort-by">Sort by:</label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={handleClearHistory}
                  style={{ color: '#e74c3c' }}
                >
                  Clear All History
                </button>
              </div>

              <div className="history-grid">
                {sortedHistory.map((historyItem) => {
                  const property = historyItem.property
                  return (
                    <div key={historyItem._id} className="history-card">
                      <div className="history-card-image">
                        {property?.images?.[0] ? (
                          <img src={property.images[0]} alt={property.name} />
                        ) : (
                          <div className="img-placeholder">🏠</div>
                        )}
                        <Link
                          to={`/property/${property?._id}`}
                          className="history-card-overlay"
                          style={{ textDecoration: 'none' }}
                        >
                          <span>View Details</span>
                        </Link>
                      </div>

                      <div className="history-card-content">
                        <h3>
                          <Link
                            to={`/property/${property?._id}`}
                            style={{
                              color: '#1a202c',
                              textDecoration: 'none',
                            }}
                          >
                            {property?.name}
                          </Link>
                        </h3>
                        <p className="history-card-address">📍 {property?.address}</p>
                        <p className="history-card-type">{property?.type}</p>

                        <div className="history-card-footer">
                          <div className="history-card-price">
                            ${property?.rent}
                            <span>/month</span>
                          </div>
                          <div className="history-card-actions">
                            <button
                              className="btn btn-small btn-outline"
                              onClick={() => handleRemoveFromHistory(property?._id)}
                              title="Remove from history"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <p className="history-card-visited">
                          Visited: {formatDate(historyItem.visitedAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
