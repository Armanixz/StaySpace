import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const Wishlist = () => {
  const { user, removeFromWishlist } = useAuth()
  const navigate = useNavigate()

  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'tenant') {
      navigate('/')
      return
    }

    fetchWishlist()
  }, [user, navigate])

  const fetchWishlist = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/api/tenant/wishlist')
      setWishlist(data)
    } catch (err) {
      setError('Failed to load wishlist')
      console.error('Error fetching wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (propertyId) => {
    if (!window.confirm('Remove this property from your wishlist?')) return

    try {
      await removeFromWishlist(propertyId)
      setWishlist((prev) => prev.filter((p) => p._id !== propertyId))
      setSuccess('Removed from wishlist!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from wishlist')
      console.error('Error removing from wishlist:', err)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>Loading wishlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="wishlist-page">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <p className="wishlist-count">{wishlist.length} properties saved</p>
        </div>

        <div className="container">
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}

          {wishlist.length === 0 ? (
            <div className="empty-state">
              <p>Your wishlist is empty. Start saving properties!</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((property) => (
                <div key={property._id} className="wishlist-card">
                  <div className="wishlist-card-image">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt={property.name} />
                    ) : (
                      <div className="img-placeholder">🏠</div>
                    )}
                  </div>

                  <div className="wishlist-card-content">
                    <h3 className="wishlist-card-title">{property.name}</h3>
                    <p className="wishlist-card-meta">{property.type}</p>
                    <p className="wishlist-card-location">📍 {property.location}</p>
                    <p className="wishlist-card-address">{property.address}</p>

                    <div className="wishlist-card-rent">
                      ৳{property.rent.toLocaleString()}<span>/month</span>
                    </div>

                    {property.averageRating > 0 && (
                      <p className="wishlist-card-rating">⭐ {property.averageRating.toFixed(1)}/5 ({property.totalReviews} reviews)</p>
                    )}

                    <div className="wishlist-card-actions">
                      <Link
                        to={`/property/${property._id}`}
                        className="btn btn-primary"
                      >
                        View Details
                      </Link>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemoveFromWishlist(property._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wishlist
