import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const Compare = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [allProperties, setAllProperties] = useState([])
  const [property1, setProperty1] = useState(null)
  const [property2, setProperty2] = useState(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [suggestions1, setSuggestions1] = useState([])
  const [suggestions2, setSuggestions2] = useState([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'tenant') {
      navigate('/login')
      return
    }
    fetchAllProperties()
  }, [user, navigate])

  const fetchAllProperties = async () => {
    setLoadingProperties(true)
    setError('')
    try {
      const { data } = await axios.get('/api/properties')
      setAllProperties(data)
    } catch (err) {
      setError('Failed to load properties')
      console.error('Error fetching properties:', err)
    } finally {
      setLoadingProperties(false)
    }
  }

  const getFilteredSuggestions = (query, excludeId = null) => {
    if (!query.trim()) return []
    return allProperties.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
                          p.address.toLowerCase().includes(query.toLowerCase()) ||
                          p.location.toLowerCase().includes(query.toLowerCase())
      const isDifferent = excludeId ? p._id !== excludeId : true
      return matchesQuery && isDifferent
    }).slice(0, 5)
  }

  useEffect(() => {
    setSuggestions1(getFilteredSuggestions(search1, property2?._id))
  }, [search1, property2, allProperties])

  useEffect(() => {
    setSuggestions2(getFilteredSuggestions(search2, property1?._id))
  }, [search2, property1, allProperties])

  const selectProperty1 = (property) => {
    setProperty1(property)
    setSearch1(property.name)
    setSuggestions1([])
  }

  const selectProperty2 = (property) => {
    setProperty2(property)
    setSearch2(property.name)
    setSuggestions2([])
  }

  const handleCompare = async () => {
    if (!property1 || !property2) {
      setError('Please select both properties')
      return
    }
    setComparing(true)
  }

  const clearSelection = () => {
    setProperty1(null)
    setProperty2(null)
    setSearch1('')
    setSearch2('')
    setSuggestions1([])
    setSuggestions2([])
    setComparing(false)
    setError('')
  }

  const getAmenities = (prop) => {
    return prop?.amenities || []
  }

  const getReviews = (prop) => {
    return prop?.reviews || []
  }

  const getAverageRating = (prop) => {
    const reviews = getReviews(prop)
    if (reviews.length === 0) return 0
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return avg.toFixed(1)
  }

  if (loadingProperties) {
    return (
      <div>
        <Navbar />
        <div className="compare-page">
          <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p>Loading properties...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="compare-page">
        <div className="compare-header">
          <Link to="/" className="btn btn-outline">
            ← Back to Home
          </Link>
          <h1>Compare Properties</h1>
          <div style={{ width: '120px' }}></div>
        </div>

        <div className="container">
          {error && <div className="error-message">{error}</div>}

          {!comparing ? (
            <div className="compare-selection">
              <div className="selection-card">
                <h3>Select Property 1</h3>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by name, address, or location..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="compare-search-input"
                  />
                  {suggestions1.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions1.map(prop => (
                        <div
                          key={prop._id}
                          className="suggestion-item"
                          onClick={() => selectProperty1(prop)}
                        >
                          <div className="suggestion-name">{prop.name}</div>
                          <div className="suggestion-meta">
                            {prop.address} • ${prop.rent}/mo
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {property1 && (
                  <div className="selected-property">
                    <div className="selected-img">
                      {property1.images?.[0] ? (
                        <img src={property1.images[0]} alt={property1.name} />
                      ) : (
                        <div className="img-placeholder">🏠</div>
                      )}
                    </div>
                    <div className="selected-info">
                      <h4>{property1.name}</h4>
                      <p className="selected-address">{property1.address}</p>
                      <p className="selected-price">${property1.rent}/month</p>
                    </div>
                    <button
                      className="btn-close"
                      onClick={() => {
                        setProperty1(null)
                        setSearch1('')
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="selection-divider">VS</div>

              <div className="selection-card">
                <h3>Select Property 2</h3>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by name, address, or location..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="compare-search-input"
                  />
                  {suggestions2.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions2.map(prop => (
                        <div
                          key={prop._id}
                          className="suggestion-item"
                          onClick={() => selectProperty2(prop)}
                        >
                          <div className="suggestion-name">{prop.name}</div>
                          <div className="suggestion-meta">
                            {prop.address} • ${prop.rent}/mo
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {property2 && (
                  <div className="selected-property">
                    <div className="selected-img">
                      {property2.images?.[0] ? (
                        <img src={property2.images[0]} alt={property2.name} />
                      ) : (
                        <div className="img-placeholder">🏠</div>
                      )}
                    </div>
                    <div className="selected-info">
                      <h4>{property2.name}</h4>
                      <p className="selected-address">{property2.address}</p>
                      <p className="selected-price">${property2.rent}/month</p>
                    </div>
                    <button
                      className="btn-close"
                      onClick={() => {
                        setProperty2(null)
                        setSearch2('')
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Side-by-side comparison view
            <div className="compare-grid">
              {/* Property 1 */}
              <div className="compare-column">
                <div className="compare-image">
                  {property1.images?.[0] ? (
                    <img src={property1.images[0]} alt={property1.name} />
                  ) : (
                    <div className="img-placeholder">🏠</div>
                  )}
                </div>

                <div className="compare-details">
                  <Link to={`/property/${property1._id}`} className="compare-property-name">
                    {property1.name}
                  </Link>

                  <div className="compare-row">
                    <span className="compare-label">Monthly Rent</span>
                    <span className="compare-value">${property1.rent}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Address</span>
                    <span className="compare-value">{property1.address}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Type</span>
                    <span className="compare-value">{property1.type}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Location</span>
                    <span className="compare-value">{property1.location}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Availability</span>
                    <span className={`compare-value ${property1.availability?.toLowerCase()}`}>
                      {property1.availability}
                    </span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Rating</span>
                    <span className="compare-value">
                      {getAverageRating(property1)} ⭐ ({getReviews(property1).length} reviews)
                    </span>
                  </div>

                  <div className="compare-section">
                    <h4>Description</h4>
                    <p className="compare-description">{property1.description || 'No description'}</p>
                  </div>

                  <div className="compare-section">
                    <h4>Amenities</h4>
                    <ul className="amenities-list">
                      {getAmenities(property1).length > 0 ? (
                        getAmenities(property1).map((amenity, idx) => (
                          <li key={idx}>✓ {amenity}</li>
                        ))
                      ) : (
                        <li>No amenities listed</li>
                      )}
                    </ul>
                  </div>

                  <Link to={`/property/${property1._id}`} className="btn btn-primary btn-block">
                    View Full Details
                  </Link>
                </div>
              </div>

              {/* Property 2 */}
              <div className="compare-column">
                <div className="compare-image">
                  {property2.images?.[0] ? (
                    <img src={property2.images[0]} alt={property2.name} />
                  ) : (
                    <div className="img-placeholder">🏠</div>
                  )}
                </div>

                <div className="compare-details">
                  <Link to={`/property/${property2._id}`} className="compare-property-name">
                    {property2.name}
                  </Link>

                  <div className="compare-row">
                    <span className="compare-label">Monthly Rent</span>
                    <span className="compare-value">${property2.rent}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Address</span>
                    <span className="compare-value">{property2.address}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Type</span>
                    <span className="compare-value">{property2.type}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Location</span>
                    <span className="compare-value">{property2.location}</span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Availability</span>
                    <span className={`compare-value ${property2.availability?.toLowerCase()}`}>
                      {property2.availability}
                    </span>
                  </div>

                  <div className="compare-row">
                    <span className="compare-label">Rating</span>
                    <span className="compare-value">
                      {getAverageRating(property2)} ⭐ ({getReviews(property2).length} reviews)
                    </span>
                  </div>

                  <div className="compare-section">
                    <h4>Description</h4>
                    <p className="compare-description">{property2.description || 'No description'}</p>
                  </div>

                  <div className="compare-section">
                    <h4>Amenities</h4>
                    <ul className="amenities-list">
                      {getAmenities(property2).length > 0 ? (
                        getAmenities(property2).map((amenity, idx) => (
                          <li key={idx}>✓ {amenity}</li>
                        ))
                      ) : (
                        <li>No amenities listed</li>
                      )}
                    </ul>
                  </div>

                  <Link to={`/property/${property2._id}`} className="btn btn-primary btn-block">
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {comparing && (
            <div className="compare-actions">
              <button className="btn btn-outline" onClick={clearSelection}>
                ← Select Different Properties
              </button>
            </div>
          )}

          {!comparing && property1 && property2 && (
            <div className="compare-actions">
              <button className="btn btn-primary" onClick={handleCompare}>
                Compare Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Compare
