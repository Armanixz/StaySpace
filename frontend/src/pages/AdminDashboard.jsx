import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, totalTenants: 0, totalLandlords: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/stats'),
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      setError('Failed to load data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await axios.delete(`/api/admin/users/${id}`)
      setUsers(users.filter((u) => u._id !== id))
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers - 1,
        totalTenants: users.find((u) => u._id === id)?.role === 'tenant'
          ? prev.totalTenants - 1
          : prev.totalTenants,
        totalLandlords: users.find((u) => u._id === id)?.role === 'landlord'
          ? prev.totalLandlords - 1
          : prev.totalLandlords,
      }))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getInitials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <p>Welcome back, {user?.name} — StaySpace Control Panel</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-outline"
            style={{ color: '#bfdbfe', borderColor: '#93c5fd' }}
            onClick={() => navigate('/')}
          >
            View Site
          </button>
          <button className="btn btn-ghost" style={{ color: '#fff', borderColor: '#4b5563' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {/* Stats */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-icon">👥</div>
            <div>
              <div className="stat-card-value">{stats.totalUsers}</div>
              <div className="stat-card-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🏠</div>
            <div>
              <div className="stat-card-value">{stats.totalTenants}</div>
              <div className="stat-card-label">Tenants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🏢</div>
            <div>
              <div className="stat-card-value">{stats.totalLandlords}</div>
              <div className="stat-card-label">Landlords</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-card">
          <div className="table-header">
            <h2>All Users</h2>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {users.length} account{users.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{getInitials(u.name)}</div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{u.email}</td>
                      <td style={{ color: '#64748b' }}>{u.phone}</td>
                      <td>
                        <span className={`badge badge-${u.role}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{formatDate(u.createdAt)}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(u._id, u.name)}
                            disabled={deletingId === u._id}
                          >
                            {deletingId === u._id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
