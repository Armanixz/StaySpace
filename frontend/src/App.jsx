import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import CreateListing from './pages/CreateListing'
import PropertyDetail from './pages/PropertyDetail'
import Wishlist from './pages/Wishlist'

const PrivateRoute = ({ children, adminRequired = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (adminRequired && user.role !== 'admin') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminRequired>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-listing"
          element={
            <PrivateRoute>
              <CreateListing />
            </PrivateRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
