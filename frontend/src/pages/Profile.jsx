/**
 * Arman
 * Profile page (/profile) — available to all logged-in users.
 *   - Edit profile: update name, phone, or password via PUT /api/auth/profile
 *   - Landlords also see their own listings (fetched from GET /api/properties/my)
 *     with a delete button and a link to create a new listing
 */
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
  const [saving, setSaving] = useState(false)
  const [loadingListings, setLoadingListings] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setForm({ name: user.name, phone: user.phone || '', password: '' })
    if (user.role === 'landlord') fetchMyListings()
  }, [user])

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

  if (!user) return null

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">

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

        {/* My Listings (Landlord only) */}
        {user.role === 'landlord' && (
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
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
