
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [landlordBookings, setLandlordBookings] = useState([]) // For landlord's property bookings
  const [saving, setSaving] = useState(false)
  const [loadingListings, setLoadingListings] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingLandlordBookings, setLoadingLandlordBookings] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  // PROFILE FEATURE — State for edit price modal
  const [editingPropertyId, setEditingPropertyId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [updatingPrice, setUpdatingPrice] = useState(false)

  useEffect(() => {
    if (!user) { 
      navigate('/login')
      return 
    }
    setForm({ name: user.name, phone: user.phone || '', password: '' })
    if (user.role === 'landlord') {
      fetchMyListings()
      fetchLandlordBookings()
    } else if (user.role === 'tenant') {
      fetchMyBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate])

  const fetchMyListings = async () => {
    setLoadingListings(true)
    try {
      const { data } = await axios.get('/api/properties/my')
      setListings(data)
    } catch {
      // silent fail
    } finally {
      setLoadingListings(false)
    }
  }

  const fetchLandlordBookings = async () => {
    setLoadingLandlordBookings(true)
    try {
      const { data } = await axios.get('/api/tenant/landlord/bookings')
      console.log('Landlord bookings fetched:', data)
      setLandlordBookings(data)
    } catch (err) {
      console.error('Error fetching landlord bookings:', err)
    } finally {
      setLoadingLandlordBookings(false)
    }
  }

  const fetchMyBookings = async () => {
    setLoadingBookings(true)
    try {
      const { data } = await axios.get('/api/tenant/bookings')
      console.log('Bookings fetched:', data)
      setBookings(data)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess('')
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const payload = { name: form.name, phone: form.phone }
      if (form.password) payload.password = form.password
      await updateUser(payload)
      setSuccess('Profile updated successfully!')
      setForm((f) => ({ ...f, password: '' }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    try {
      await axios.delete(`/api/properties/${id}`)
      setListings((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete')
    }
  }

  // PROFILE FEATURE — Handle edit price modal open/close
  const handleOpenEditPrice = (property) => {
    setEditingPropertyId(property._id)
    setEditPrice(property.rent)
  }

  const handleCloseEditPrice = () => {
    setEditingPropertyId(null)
    setEditPrice('')
  }

  // PROFILE FEATURE — Handle update property price
  const handleUpdatePrice = async () => {
    if (!editPrice || editPrice < 0) {
      alert('Please enter a valid price')
      return
    }
    setUpdatingPrice(true)
    try {
      const response = await axios.put(`/api/properties/${editingPropertyId}`, {
        rent: parseFloat(editPrice)
      })
      setListings((prev) =>
        prev.map((p) => (p._id === editingPropertyId ? response.data.property : p))
      )
      setSuccess('Price updated successfully!')
      handleCloseEditPrice()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update price')
    } finally {
      setUpdatingPrice(false)
    }
  }

  const handleConfirmBooking = async (id) => {
    if (!window.confirm('Confirm this booking request?')) return
    try {
      await axios.put(`/api/tenant/landlord/bookings/${id}/confirm`)
      fetchLandlordBookings()
      setSuccess('Booking confirmed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm booking')
    }
  }

  const handleRejectBooking = async (id) => {
    if (!window.confirm('Reject this booking request?')) return
    try {
      await axios.put(`/api/tenant/landlord/bookings/${id}/reject`)
      fetchLandlordBookings()
      setSuccess('Booking rejected successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking')
    }
  }

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await axios.put(`/api/tenant/bookings/${id}/cancel`)
      fetchMyBookings()
      setSuccess('Booking cancelled successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking')
    }
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <Navbar />
      <div className={user.role === 'tenant' ? 'profile-content-tenant' : 'profile-content'}>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{user.name}</h2>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <h3 className="profile-section-title">Edit Profile</h3>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>New Password <span style={{ fontWeight: 400, color: '#888' }}>(leave blank to keep current)</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Tenant: My Bookings */}
        {user.role === 'tenant' && (
          <div className="my-listings-section">
            <div className="my-listings-header">
              <h3>My Bookings</h3>
            </div>

            {loadingBookings ? (
              <p className="empty-state">Loading bookings…</p>
            ) : bookings.filter(b => b.status !== 'cancelled').length === 0 ? (
              <div className="empty-state">
                <p>You haven't booked any properties yet.</p>
              </div>
            ) : (
              <div className="my-listings-grid">
                {bookings
                  .filter(booking => booking.status !== 'cancelled')
                  .map((booking) => {
                    // Skip if property is deleted
                    if (!booking.property) return null;
                    
                    return (
                    <div key={booking._id} className="my-listing-card">
                      <div className="my-listing-img">
                        {booking.property?.images?.[0] ? (
                          <img src={booking.property.images[0]} alt={booking.property.name} />
                        ) : (
                          <div className="img-placeholder">🏠</div>
                        )}
                      </div>
                      <div className="my-listing-info">
                        <h4>{booking.property?.name || 'Property'}</h4>
                        <p className="listing-meta">{booking.property?.type || 'N/A'} · {booking.property?.location || 'N/A'}</p>
                        <p className="listing-rent">৳{booking.property?.rent?.toLocaleString() || '0'}<span>/mo</span></p>
                        <p className="booking-dates">
                          <strong>Check-in:</strong> {new Date(booking.checkInDate).toLocaleDateString()}<br/>
                          <strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}
                        </p>
                        <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* My Listings (Landlord only) */}
        {user.role === 'landlord' && (
          <>
            {/* Booking Requests Section */}
            <div className="my-listings-section">
              <div className="my-listings-header">
                <h3>Booking Requests</h3>
              </div>

              {loadingLandlordBookings ? (
                <p className="empty-state">Loading booking requests…</p>
              ) : landlordBookings.filter(b => b.status === 'pending').length === 0 ? (
                <div className="empty-state">
                  <p>No pending booking requests.</p>
                </div>
              ) : (
                <div className="my-listings-grid">
                  {landlordBookings
                    .filter(booking => booking.status === 'pending')
                    .map((booking) => {
                      if (!booking.property) return null;
                      
                      return (
                      <div key={booking._id} className="my-listing-card booking-request-card">
                        <div className="my-listing-img">
                          {booking.property?.images?.[0] ? (
                            <img src={booking.property.images[0]} alt={booking.property.name} />
                          ) : (
                            <div className="img-placeholder">🏠</div>
                          )}
                        </div>
                        <div className="my-listing-info">
                          <h4>{booking.property?.name || 'Property'}</h4>
                          <p className="listing-meta">{booking.property?.type || 'N/A'} · {booking.property?.location || 'N/A'}</p>
                          <p className="listing-rent">৳{booking.property?.rent?.toLocaleString() || '0'}<span>/mo</span></p>
                          <p className="booking-tenant">
                            <strong>Tenant:</strong> {booking.tenant?.name || 'Unknown'}<br/>
                            <strong>Email:</strong> {booking.tenant?.email || 'N/A'}<br/>
                            {booking.tenant?.phone && (
                              <><strong>Phone:</strong> {booking.tenant.phone}<br/></>
                            )}
                          </p>
                          <p className="booking-dates">
                            <strong>Check-in:</strong> {new Date(booking.checkInDate).toLocaleDateString()}<br/>
                            <strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                          <span className="badge badge-pending">{booking.status}</span>
                        </div>
                        <div className="booking-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleConfirmBooking(booking._id)}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleRejectBooking(booking._id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* My Listings Section */}
            <div className="my-listings-section">
              <div className="my-listings-header">
                <h3>My Listings</h3>
                <Link to="/create-listing" className="btn btn-primary">
                  + Add New Listing
                </Link>
              </div>

              {loadingListings ? (
                <p className="empty-state">Loading listings…</p>
              ) : listings.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't added any listings yet.</p>
                  <Link to="/create-listing" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    Create Your First Listing
                  </Link>
                </div>
              ) : (
                <div className="my-listings-grid">
                  {listings.map((p) => (
                    <div key={p._id} className="my-listing-card">
                      <div className="my-listing-img">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} />
                        ) : (
                          <div className="img-placeholder">🏠</div>
                        )}
                      </div>
                      <div className="my-listing-info">
                        <h4>{p.name}</h4>
                        <p className="listing-meta">{p.type} · {p.location}</p>
                        <p className="listing-rent">৳{p.rent.toLocaleString()}<span>/mo</span></p>
                      </div>
                      <div className="listing-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/property/${p._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-info"
                          onClick={() => handleOpenEditPrice(p)}
                        >
                          Edit Price
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(p._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* PROFILE FEATURE — Edit Price Modal */}
      {editingPropertyId && (
        <div className="modal-overlay" onClick={handleCloseEditPrice}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Property Price</h3>
              <button className="modal-close" onClick={handleCloseEditPrice}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Monthly Rent (৳)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Enter new price"
                  min="0"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseEditPrice}
                disabled={updatingPrice}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdatePrice}
                disabled={updatingPrice}
              >
                {updatingPrice ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
