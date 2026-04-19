
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookedPropertyIds, setBookedPropertyIds] = useState([]) //  selected properties for comparison

  useEffect(() => {
    fetchProperties()
    if (user?.role === 'tenant') {
      fetchBookedProperties()
    }
  }, [user])

  const fetchProperties = async (query = '') => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/properties', {
        params: query ? { search: query } : {},
      })
      setProperties(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const fetchBookedProperties = async () => {
    try {
      const { data } = await axios.get('/api/tenant/bookings')
      // Get IDs of properties that have non-cancelled bookings
      const bookedIds = data
        .filter(booking => booking.status !== 'cancelled' && booking.property)
        .map(booking => booking.property._id)
      setBookedPropertyIds(bookedIds)
    } catch (err) {
      console.error('Error fetching bookings:', err)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProperties(search.trim())
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    if (e.target.value === '') fetchProperties('')
  }

  const handleOpenBookingModal = (property) => {
    if (!user || user.role !== 'tenant') {
      alert('Please login as a tenant to book properties')
      return
    }
    setBookingModal(property)
    setCheckIn('')
    setCheckOut('')
  }

  const handleCloseBookingModal = () => {
    setBookingModal(null)
    setCheckIn('')
    setCheckOut('')
  }

  const handleBookProperty = async (e) => {
    e.preventDefault()
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }
    setSubmitting(true)
    try {
      await axios.post('/api/tenant/bookings', {
        propertyId: bookingModal._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      })
      alert('Booking request submitted successfully!')
      handleCloseBookingModal()
      // Refresh booked properties list
      fetchBookedProperties()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book property')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <h1>
          Find Your Perfect <span>StaySpace</span>
        </h1>
        <p>
          The smartest way to discover rooms and flats for rent. Connect with
          verified landlords and find your ideal home today.
        </p>
        <div className="hero-buttons">
          {user ? (
            user.role === 'admin' ? (
              <Link to="/admin" className="btn-hero-primary">
                Go to Admin Panel
              </Link>
            ) : user.role === 'landlord' ? (
              <Link to="/create-listing" className="btn-hero-primary">
                + Add New Listing
              </Link>
            ) : (
              <a href="#listings" className="btn-hero-primary">
                Browse Listings
              </a>
            )
          ) : (
            <>
              <Link to="/register" className="btn-hero-primary">
                Get Started — It&apos;s Free
              </Link>
              <Link to="/login" className="btn-hero-outline">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Search + Listings */}
      <section className="section listings-section" id="listings">
        <h2 className="section-title">Available Properties</h2>
        <p className="section-subtitle">Search by name, city, or property type</p>

        <form className="search-bar-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search properties, cities, types…"
            value={search}
            onChange={handleSearchChange}
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        {loading ? (
          <p className="empty-state">Loading properties…</p>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <p>No properties found{search ? ` for "${search}"` : ''}.</p>
            {user?.role === 'landlord' && (
              <Link to="/create-listing" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Be the first to list a property
              </Link>
            )}
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map((p) => (
              <div key={p._id} className="property-card">
                <Link to={`/property/${p._id}`} className="property-card-link">
                  <div className="property-card-img">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} />
                    ) : (
                      <div className="img-placeholder">🏠</div>
                    )}
                    <span className="property-type-badge">{p.type}</span>
                  </div>
                  <div className="property-card-body">
                    <h3 className="property-name">{p.name}</h3>
                    <p className="property-location">📍 {p.location}</p>
                    <p className="property-address">{p.address}</p>
                    <div className="property-card-footer">
                      <span className="property-rent">৳{p.rent.toLocaleString()}<span>/mo</span></span>
                      <span className="property-landlord">by {p.landlord?.name || 'Landlord'}</span>
                    </div>
                  </div>
                </Link>
                {user?.role === 'tenant' && (
                  <div className="property-actions">
                    {bookedPropertyIds.includes(p._id) ? (
                      <button className="btn btn-booked" disabled>
                        Already Booked
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          handleOpenBookingModal(p)
                        }}
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Find Your Space?</h2>
        <p>
          Join thousands of tenants and landlords already using StaySpace.
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} StaySpace. Built with the MERN stack.</p>
      </footer>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book {bookingModal.name}</h3>
              <button className="modal-close" onClick={handleCloseBookingModal}>×</button>
            </div>
            <form onSubmit={handleBookProperty} className="modal-form">
              <div className="form-group">
                <label>Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={handleCloseBookingModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

