import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'


const PropertyDetail = () => {
  const { id } = useParams()
  const { user, getWishlist, addToWishlist, removeFromWishlist } = useAuth()
  const navigate = useNavigate()
  
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasBooked, setHasBooked] = useState(false)
  const [userRating, setUserRating] = useState(null) // User's existing rating
  const [inWishlist, setInWishlist] = useState(false)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  
  // Rating form state
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [submittingRating, setSubmittingRating] = useState(false)
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)

  // Report state
  const [landlordReports, setLandlordReports] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportError, setReportError] = useState(null)

  useEffect(() => {
    fetchPropertyDetails()
    if (user?.role === 'tenant') {
      checkIfBooked()
      checkWishlistStatus()
    }
  }, [id, user])

  const fetchPropertyDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(`/api/properties/${id}`)
      console.log('Property data:', data)
      console.log('Reviews:', data.reviews)
      console.log('Current user:', user)
      setProperty(data)
      
      // Fetch landlord reports after property is loaded
      if (user?.role === 'tenant') {
        try {
          const { data: reportsData } = await axios.get(`/api/reports/${data.landlord._id}`)
          setLandlordReports(reportsData || [])
        } catch (err) {
          console.error('Error fetching landlord reports:', err)
          setLandlordReports([])
        }
      }
      
      // Check if current user has already rated
      if (user?.role === 'tenant' && data.reviews) {
        const existingRating = data.reviews.find(
          review => {
            console.log('Checking review:', review, 'against user ID:', user._id)
            return review.tenant?._id === user._id
          }
        )
        console.log('Existing rating found:', existingRating)
        if (existingRating) {
          setUserRating(existingRating)
          setRating(existingRating.rating)
        } else {
          // Reset if no rating found
          setUserRating(null)
          setRating(5)
        }
      } else {
        // Reset if not a tenant or no reviews
        setUserRating(null)
        setRating(5)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const checkIfBooked = async () => {
    try {
      const { data } = await axios.get('/api/tenant/bookings')
      const booked = data.some(
        booking => 
          booking.property?._id === id && 
          booking.status === 'confirmed' // Only confirmed bookings
      )
      setHasBooked(booked)
    } catch (err) {
      console.error('Error checking bookings:', err)
    }
  }

  const checkWishlistStatus = async () => {
    try {
      const wishlist = await getWishlist()
      const isInWishlist = wishlist.some(item => item._id === id)
      setInWishlist(isInWishlist)
    } catch (err) {
      console.error('Error checking wishlist:', err)
    }
  }

  const handleToggleWishlist = async () => {
    if (!user || user.role !== 'tenant') {
      alert('Please login as a tenant to save properties')
      return
    }

    setTogglingWishlist(true)
    try {
      if (inWishlist) {
        await removeFromWishlist(id)
        setInWishlist(false)
      } else {
        await addToWishlist(id)
        setInWishlist(true)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update wishlist')
    } finally {
      setTogglingWishlist(false)
    }
  }

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'tenant') {
      alert('Please login as a tenant to rate')
      return
    }
    
    if (!hasBooked) {
      alert('You can only rate landlords for properties with confirmed bookings')
      return
    }
    
    console.log('Submitting rating:', rating, 'for property:', id)
    setSubmittingRating(true)
    try {
      const response = await axios.post('/api/reviews', {
        propertyId: id,
        rating: Number(rating),
      })
      console.log('Rating response:', response.data)
      const message = userRating ? 'Rating updated successfully!' : 'Rating submitted successfully!'
      alert(message)
      setShowRatingForm(false)
      await fetchPropertyDetails() // Refresh to show new rating
    } catch (err) {
      console.error('Rating error:', err.response?.data)
      alert(err.response?.data?.message || 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!window.confirm('Are you sure you want to delete your rating?')) return
    
    try {
      await axios.delete(`/api/reviews/${userRating._id}`)
      alert('Rating deleted successfully!')
      setUserRating(null)
      setRating(5)
      await fetchPropertyDetails() // Refresh to show updated ratings
    } catch (err) {
      console.error('Delete rating error:', err.response?.data)
      alert(err.response?.data?.message || 'Failed to delete rating')
    }
  }

  const handleBookProperty = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'tenant') {
      alert('Please login as a tenant to book properties')
      return
    }
    
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }
    
    setSubmittingBooking(true)
    try {
      await axios.post('/api/tenant/bookings', {
        propertyId: id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      })
      alert('Booking request submitted successfully!')
      setShowBookingModal(false)
      setCheckIn('')
      setCheckOut('')
      // Refresh booking status
      checkIfBooked()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book property')
    } finally {
      setSubmittingBooking(false)
    }
  }

  const fetchLandlordReports = async () => {
    try {
      if (!property?.landlord?._id) {
        return
      }
      const { data } = await axios.get(`/api/reports/${property.landlord._id}`)
      setLandlordReports(data || [])
    } catch (err) {
      console.error('Error fetching landlord reports:', err)
      setLandlordReports([])
    }
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'tenant') {
      alert('Please login as a tenant to report landlords')
      return
    }

    if (!reportDescription.trim()) {
      setReportError('Please describe the issue')
      return
    }

    if (reportDescription.length > 1000) {
      setReportError('Report description cannot exceed 1000 characters')
      return
    }

    setSubmittingReport(true)
    setReportError(null)
    try {
      console.log('Submitting report with:', {
        landlordId: property.landlord._id,
        propertyId: id,
        description: reportDescription.trim()
      })
      
      const response = await axios.post(`/api/reports/landlord/${property.landlord._id}`, {
        propertyId: id,
        description: reportDescription.trim(),
      })
      console.log('Report submitted successfully:', response.data)
      
      // Immediately add the new report to the state for instant UI update
      const newReport = response.data
      console.log('Adding new report to state:', newReport)
      setLandlordReports([newReport, ...landlordReports])
      
      // Close form immediately
      setShowReportForm(false)
      setReportDescription('')
      setSubmittingReport(false)
      setReportError(null)
      
      // Show success message
      alert('Report submitted successfully!')
    } catch (err) {
      console.error('Error submitting report:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error message:', err.message)
      setSubmittingReport(false)
      setReportError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to submit report')
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return
    
    try {
      await axios.delete(`/api/reports/${reportId}`)
      alert('Report deleted successfully!')
      try {
        await fetchLandlordReports()
      } catch (refreshErr) {
        console.error('Error refreshing reports after deletion:', refreshErr)
        // Don't show error to user - report was deleted successfully
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report')
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const renderRatingNumber = (rating) => {
    return <span className="rating-badge">{rating}/5</span>
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'red' }}>{error || 'Property not found'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      
      <div className="property-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <span>{property.name}</span>
        </div>

        {/* Property Header */}
        <div className="property-header">
          <div className="property-header-left">
            <h1>{property.name}</h1>
            <p className="property-location-large">📍 {property.location}</p>
            <p className="property-address-large">{property.address}</p>
          </div>
          <div className="property-header-right">
            <span className="property-type-badge-large">{property.type}</span>
            <span className={`availability-badge ${property.availability?.toLowerCase()}`}>
              {property.availability || 'Available'}
            </span>
            <div className="property-rent-large">
              ৳{property.rent?.toLocaleString()}<span>/month</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {property.images && property.images.length > 0 && (
          <div className="property-images">
            <div className="main-image">
              <img src={property.images[0]} alt={property.name} />
            </div>
            {property.images.length > 1 && (
              <div className="thumbnail-images">
                {property.images.slice(1, 5).map((img, idx) => (
                  <img key={idx} src={img} alt={`${property.name} ${idx + 2}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="property-content-grid">
          {/* Left Column - Details */}
          <div className="property-details-section">
            {/* Description */}
            {property.description && (
              <div className="detail-card">
                <h2>Description</h2>
                <p>{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="detail-card">
                <h2>Amenities</h2>
                <ul className="amenities-list">
                  {property.amenities.map((amenity, idx) => (
                    <li key={idx}>✓ {amenity}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Landlord Ratings Section */}
            <div className="detail-card reviews-section">
              <div className="reviews-header">
                <h2>
                  Landlord Ratings
                  {property.totalReviews > 0 && (
                    <span className="review-count">({property.totalReviews})</span>
                  )}
                </h2>
                {property.averageRating > 0 && (
                  <div className="average-rating">
                    <span className="rating-number-large">{property.averageRating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {user?.role === 'tenant' && hasBooked && !showRatingForm && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowRatingForm(true)}
                  >
                    {userRating ? 'Change Rating' : 'Rate Landlord'}
                  </button>
                  {userRating && (
                    <button 
                      className="btn btn-danger"
                      onClick={handleDeleteRating}
                    >
                      Delete Rating
                    </button>
                  )}
                </div>
              )}

              {user?.role === 'tenant' && hasBooked && userRating && !showRatingForm && (
                <div className="current-rating-info">
                  <p>Your current rating: <strong>{userRating.rating}/5</strong></p>
                </div>
              )}

              {showRatingForm && (
                <form onSubmit={handleSubmitRating} className="rating-form">
                  <div className="form-group">
                    <label>Select Rating</label>
                    <div className="rating-buttons">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`rating-btn ${rating === num ? 'selected' : ''}`}
                          onClick={() => setRating(num)}
                        >
                          {num}/5
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowRatingForm(false)
                        setRating(userRating?.rating || 5)
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submittingRating}>
                      {submittingRating ? 'Submitting...' : (userRating ? 'Update Rating' : 'Submit Rating')}
                    </button>
                  </div>
                </form>
              )}

              {user?.role === 'tenant' && hasBooked && userRating && (
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteRating}
                  style={{ marginTop: '1rem' }}
                >
                  Delete Your Rating
                </button>
              )}

              {property.reviews && property.reviews.length > 0 ? (
                <div className="ratings-list">
                  {property.reviews.map((review) => (
                    <div key={review._id} className="rating-item">
                      <div className="rating-header">
                        <strong>{review.tenant?.name || 'Anonymous'}</strong>
                        {renderRatingNumber(review.rating)}
                      </div>
                      <span className="rating-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state-small">No ratings yet. Be the first to rate!</p>
              )}
            </div>

            {/* Landlord Reports Section - Tenant View */}
            {user?.role === 'tenant' && (
              <div className="detail-card reports-section">
                <div className="reports-header">
                  <h2>Landlord Reports</h2>
                  {landlordReports.length > 0 && (
                    <span className="report-count">({landlordReports.length})</span>
                  )}
                </div>

                {landlordReports.length > 0 ? (
                  <div className="reports-list">
                    {landlordReports.map((report) => (
                      <div key={report._id} className="report-item">
                        <div className="report-header">
                          <span className="report-by">
                            Reported by: <strong>{report.reporter?.name || 'Anonymous'}</strong>
                          </span>
                          <span className="report-date">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="report-description">{report.description}</p>
                        {user?.role === 'tenant' && report.reporter?._id === user._id && (
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteReport(report._id)}
                            style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                          >
                            Delete My Report
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state-small">No reports filed against this landlord</p>
                )}

                <div style={{ marginTop: '1rem' }}>
                  {!showReportForm ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowReportForm(true)}
                    >
                      File a Report
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitReport} className="report-form">
                      <div className="form-group">
                        <label>Describe the Issue</label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => {
                            setReportDescription(e.target.value)
                            setReportError(null)
                          }}
                          placeholder="Please provide details about your issue with this landlord..."
                          maxLength="1000"
                          rows="5"
                          className="report-textarea"
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                          {reportDescription.length}/1000 characters
                        </small>
                      </div>
                      {reportError && (
                        <div style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '0.9rem' }}>
                          {reportError}
                        </div>
                      )}
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setShowReportForm(false)
                            setReportDescription('')
                            setReportError(null)
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingReport}
                        >
                          {submittingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="property-sidebar">
            {/* Landlord Info */}
            <div className="detail-card">
              <h3>Landlord</h3>
              <div className="landlord-info">
                <div className="landlord-avatar">
                  {property.landlord?.name?.charAt(0).toUpperCase() || 'L'}
                </div>
                <div>
                  <p className="landlord-name">{property.landlord?.name || 'Unknown'}</p>
                  {property.landlord?.email && (
                    <p className="landlord-contact">📧 {property.landlord.email}</p>
                  )}
                  {property.landlord?.phone && (
                    <p className="landlord-contact">📞 {property.landlord.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Tenants */}
            {property.tenants && property.tenants.length > 0 && (
              <div className="detail-card">
                <h3>Current Tenants</h3>
                <ul className="tenants-list">
                  {property.tenants.map((tenant) => (
                    <li key={tenant._id}>
                      <div className="tenant-avatar">
                        {tenant.name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div>
                        <p className="tenant-name">{tenant.name || 'Unknown'}</p>
                        {tenant.email && (
                          <p className="tenant-email">{tenant.email}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Book Now Button */}
            {user?.role === 'tenant' && (
              <>
                {hasBooked ? (
                  <button className="btn btn-booked btn-block" disabled>
                    Already Booked
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => setShowBookingModal(true)}
                  >
                    Book This Property
                  </button>
                )}
                <button
                  className={`btn btn-block ${inWishlist ? 'btn-wishlist-active' : 'btn-wishlist'}`}
                  onClick={handleToggleWishlist}
                  disabled={togglingWishlist}
                  style={{ marginTop: '0.75rem' }}
                >
                  {togglingWishlist ? 'Updating...' : (inWishlist ? '❤ Remove from Wishlist' : '🤍 Save to Wishlist')}
                </button>
              </>
            )}
            
            {!user && (
              <div className="detail-card" style={{ textAlign: 'center' }}>
                <p>Want to book this property?</p>
                <Link to="/login" className="btn btn-primary btn-block">
                  Login as Tenant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book {property.name}</h3>
              <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
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
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingBooking}>
                  {submittingBooking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetail
