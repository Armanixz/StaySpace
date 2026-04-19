
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
  
  // REPORTING FEATURE — State for tenant reports
  const [expandedBookingId, setExpandedBookingId] = useState(null)
  const [reportingTenantId, setReportingTenantId] = useState(null)
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportError, setReportError] = useState('')

  // REPORTING FEATURE — State for reports against current user
  const [reportsAgainstMe, setReportsAgainstMe] = useState([])
  const [loadingReportsAgainstMe, setLoadingReportsAgainstMe] = useState(false)

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
    // Fetch reports against current user for both landlords and tenants
    fetchReportsAgainstMe()
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

  // REPORTING FEATURE — Fetch reports filed against current user
  const fetchReportsAgainstMe = async () => {
    if (!user) return
    setLoadingReportsAgainstMe(true)
    try {
      const { data } = await axios.get(`/api/reports/${user._id}`)
      console.log('Reports against me:', data)
      setReportsAgainstMe(data)
    } catch (err) {
      console.error('Error fetching reports against me:', err)
      // Silent fail - not critical
    } finally {
      setLoadingReportsAgainstMe(false)
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

  // REPORTING FEATURE — Handle submit report against tenant
  const handleSubmitTenantReport = async (e, booking) => {
    e.preventDefault()
    if (!reportDescription.trim()) {
      setReportError('Please describe the issue')
      return
    }

    if (reportDescription.length > 1000) {
      setReportError('Report description cannot exceed 1000 characters')
      return
    }

    setSubmittingReport(true)
    setReportError('')
    try {
      const response = await axios.post(`/api/reports/tenant/${booking.tenant._id}`, {
        propertyId: booking.property._id,
        description: reportDescription.trim(),
      })
      console.log('Tenant report submitted successfully:', response.data)
      console.log('Response status:', response.status)
      
      // Close form immediately
      setReportingTenantId(null)
      setReportDescription('')
      setSubmittingReport(false)
      setReportError('') // Ensure error is cleared
      
      // Show success message
      setSuccess('Report submitted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      
      // Add a small delay to ensure backend has processed the report
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Refresh bookings to get updated report info
      try {
        await fetchLandlordBookings()
      } catch (refreshErr) {
        console.error('Error refreshing bookings:', refreshErr)
        // Don't show error to user - report was submitted successfully
      }
    } catch (err) {
      console.error('Error submitting tenant report:', err)
      console.error('Error response:', err.response)
      console.error('Error message:', err.message)
      setSubmittingReport(false)
      setReportError(err.response?.data?.message || err.message || 'Failed to submit report')
    }
  }

  // REPORTING FEATURE — Delete tenant report
  const handleDeleteTenantReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return
    
    try {
      await axios.delete(`/api/reports/${reportId}`)
      alert('Report deleted successfully!')
      try {
        await fetchLandlordBookings()
        await fetchReportsAgainstMe() // Also refresh reports against me
      } catch (refreshErr) {
        console.error('Error refreshing after report deletion:', refreshErr)
        // Don't show error to user - report was deleted successfully
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report')
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

        {/* REPORTING FEATURE — Reports Against Me Section */}
        {reportsAgainstMe && reportsAgainstMe.length > 0 && (
          <div className="profile-card" style={{ borderTop: '3px solid #dc3545', backgroundColor: '#fff5f5' }}>
            <h3 style={{ color: '#dc3545', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Reports Against You
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.95rem' }}>
              {reportsAgainstMe.length} report{reportsAgainstMe.length !== 1 ? 's' : ''} have been filed against you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reportsAgainstMe.map((report) => (
                <div
                  key={report._id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ffdddd',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        <strong>Reported by:</strong> {report.reporter?.name || 'Anonymous'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                        {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#e8e8e8',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#333',
                        textTransform: 'uppercase',
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                  {report.property && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Property:</strong> {report.property.name}
                    </p>
                  )}
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.95rem', color: '#333', lineHeight: '1.5' }}>
                    <strong>Report Description:</strong><br/>
                    {report.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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
            {/* Booking Requests Section (Pending Bookings) */}
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
                        <div 
                          key={booking._id} 
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            padding: '1rem',
                            gap: '1rem'
                          }}
                        >
                          {/* Image */}
                          <div style={{ width: '100%', height: '180px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                            {booking.property?.images?.[0] ? (
                              <img src={booking.property.images[0]} alt={booking.property.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏠</div>
                            )}
                          </div>

                          {/* Info */}
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#333' }}>{booking.property?.name || 'Property'}</h4>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>{booking.property?.type || 'N/A'} · {booking.property?.location || 'N/A'}</p>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>৳{booking.property?.rent?.toLocaleString() || '0'}<span style={{ fontSize: '0.8rem', color: '#666' }}>/mo</span></p>
                            
                            {/* Tenant Info */}
                            <div style={{ backgroundColor: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#555' }}>
                              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Tenant:</strong> {booking.tenant?.name || 'Unknown'}</p>
                              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Email:</strong> {booking.tenant?.email || 'N/A'}</p>
                              {booking.tenant?.phone && (
                                <p style={{ margin: 0 }}><strong>Phone:</strong> {booking.tenant.phone}</p>
                              )}
                            </div>

                            {/* Dates */}
                            <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem' }}>
                              <p style={{ margin: '0 0 0.25rem 0' }}><strong>Check-in:</strong> {new Date(booking.checkInDate).toLocaleDateString()}</p>
                              <p style={{ margin: 0 }}><strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                            </div>

                            {/* Status Badge */}
                            <span style={{ display: 'inline-block', backgroundColor: '#fff3cd', color: '#856404', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                              {booking.status}
                            </span>
                          </div>

                          {/* Buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleConfirmBooking(booking._id)}
                              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', flex: 1, borderRadius: '4px' }}
                            >
                              ✓ Confirm
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleRejectBooking(booking._id)}
                              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', flex: 1, borderRadius: '4px' }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Confirmed Bookings Section */}
            <div className="my-listings-section">
              <div className="my-listings-header">
                <h3>Confirmed Bookings</h3>
              </div>

              {loadingLandlordBookings ? (
                <p className="empty-state">Loading confirmed bookings…</p>
              ) : landlordBookings.filter(b => b.status === 'confirmed').length === 0 ? (
                <div className="empty-state">
                  <p>No confirmed bookings yet.</p>
                </div>
              ) : (
                <div className="my-listings-grid">
                  {landlordBookings
                    .filter(booking => booking.status === 'confirmed')
                    .map((booking) => {
                      if (!booking.property) return null;
                      
                      return (
                        <div key={`confirmed-${booking._id}`}>
                          <div className="my-listing-card booking-confirmed-card">
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
                              <span className="badge badge-confirmed">{booking.status}</span>
                            </div>
                          </div>

                          {/* REPORTING FEATURE — Tenant Reports Section (In Confirmed Bookings) */}
                          <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid #e0e0e0', gridColumn: '1 / -1' }}>
                            <h5 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>Tenant Report History</h5>
                            {booking.tenantReports && booking.tenantReports.length > 0 ? (
                              <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.75rem 0', color: '#856404', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                  ⚠️ {booking.tenantReports.length} report(s) filed against this tenant
                                </p>
                                {booking.tenantReports.map((report) => (
                                  <div key={report._id} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #ffebd3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
                                        <strong>By:</strong> {report.reporter?.name || 'Admin'} • {new Date(report.createdAt).toLocaleDateString()}
                                      </p>
                                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>
                                        {report.description}
                                      </p>
                                    </div>
                                    {user.role === 'landlord' && report.reporter?._id === user._id && (
                                      <button
                                        onClick={() => handleDeleteTenantReport(report._id)}
                                        style={{
                                          padding: '0.35rem 0.75rem',
                                          fontSize: '0.8rem',
                                          backgroundColor: '#dc3545',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0
                                        }}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem', fontStyle: 'italic' }}>✓ No reports filed against this tenant</p>
                            )}

                            {/* Report Form */}
                            {reportingTenantId === booking.tenant._id ? (
                              <form onSubmit={(e) => handleSubmitTenantReport(e, booking)} style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                    File a Report Against This Tenant
                                  </label>
                                  <textarea
                                    value={reportDescription}
                                    onChange={(e) => {
                                      setReportDescription(e.target.value)
                                      setReportError('')
                                    }}
                                    placeholder="Describe the issue with this tenant..."
                                    maxLength="1000"
                                    rows="4"
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      fontFamily: 'inherit',
                                      fontSize: '0.9rem',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                                    {reportDescription.length}/1000 characters
                                  </small>
                                </div>
                                {reportError && (
                                  <div style={{ color: '#d32f2f', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                    {reportError}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                      setReportingTenantId(null)
                                      setReportDescription('')
                                      setReportError('')
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
                            ) : (
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  setReportingTenantId(booking.tenant._id)
                                  setReportDescription('')
                                  setReportError('')
                                }}
                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginTop: '1rem', display: 'inline-block' }}
                              >
                                📋 File a Report
                              </button>
                            )}
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
