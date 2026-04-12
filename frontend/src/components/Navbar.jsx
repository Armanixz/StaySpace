import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Stay<span>Space</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Hi, {user.name.split(' ')[0]}
            </span>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-outline">
                Admin Panel
              </Link>
            )}
            {user.role === 'landlord' && (
              <>
                <Link to="/create-listing" className="btn btn-outline">
                  + Add Listing
                </Link>
                <Link to="/profile" className="btn btn-ghost">
                  My Profile
                </Link>
              </>
            )}
            {user.role === 'tenant' && (
              <>
                <Link to="/wishlist" className="btn btn-outline">
                   Wishlist
                </Link>
                <Link to="/profile" className="btn btn-ghost">
                  My Profile
                </Link>
              </>
            )}
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
