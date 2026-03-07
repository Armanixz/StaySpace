/**
 * Arman
 * CreateListing page (/create-listing) — landlord-only.
 *   - Form fields: name, address, type (Room/Flat/Studio/House/Other), rent, location, up to 3 image URLs
 *   - Validates required fields and positive rent before submitting
 *   - POSTs to /api/properties; on success redirects to /profile to see the new listing
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const PROPERTY_TYPES = ['Room', 'Flat', 'Studio', 'House', 'Other']

const CreateListing = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    address: '',
    type: 'Flat',
    rent: '',
    location: '',
  })
  const [imageUrls, setImageUrls] = useState(['', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user || user.role !== 'landlord') {
    return (
      <div>
        <Navbar />
        <div className="auth-page">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <p>Only landlords can create listings.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Go Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleImageChange = (index, value) => {
    const updated = [...imageUrls]
    updated[index] = value
    setImageUrls(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.address || !form.type || !form.rent || !form.location) {
      setError('Please fill in all required fields.')
      return
    }
    if (Number(form.rent) <= 0) {
      setError('Rent must be a positive number.')
      return
    }

    setSubmitting(true)
    try {
      await axios.post('/api/properties', {
        ...form,
        rent: Number(form.rent),
        images: imageUrls.filter((u) => u.trim() !== ''),
      })
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="auth-page" style={{ background: '#8BAE66', alignItems: 'flex-start', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="auth-card" style={{ maxWidth: '560px' }}>
          <div className="auth-logo">
            <Link to="/">Stay<span>Space</span></Link>
          </div>
          <h2>Add New Listing</h2>
          <p className="auth-subtitle">Fill in the details for your property</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Property Name *</label>
              <input
                name="name"
                placeholder="e.g. Sunny Flat in Mirpur"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                name="address"
                placeholder="e.g. House 12, Road 5, Block B, Mirpur"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Property Type *</label>
                <select name="type" value={form.type} onChange={handleChange} required>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Rent (৳) *</label>
                <input
                  name="rent"
                  type="number"
                  min="1"
                  placeholder="e.g. 12000"
                  value={form.rent}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location / City *</label>
              <input
                name="location"
                placeholder="e.g. Dhaka, Mirpur"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Image URLs <span style={{ fontWeight: 400, color: '#888' }}>(optional, up to 3)</span></label>
              {imageUrls.map((url, i) => (
                <input
                  key={i}
                  value={url}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  placeholder={`Image URL ${i + 1}`}
                  style={{ marginBottom: '0.5rem' }}
                />
              ))}
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Listing'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/profile">← Back to Profile</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateListing
