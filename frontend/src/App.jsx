import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// #paymentGateway - Stripe payment integration imports
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import CreateListing from './pages/CreateListing'
import PropertyDetail from './pages/PropertyDetail'
import Wishlist from './pages/Wishlist'
import History from './pages/History'
import Compare from './pages/Compare'
// #chatsystem - Chat feature route import
import Messages from './pages/Messages'

// STRIPE PAYMENT FEATURE — Initialize Stripe
// #paymentGateway - Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PrivateRoute = ({ children, adminRequired = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (adminRequired && user.role !== 'admin') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/property/:id"
            element={<PropertyDetail />}
          />
          <Route
            path="/compare"
            element={
              <PrivateRoute>
                <Compare />
              </PrivateRoute>
            }
          />
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
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <History />
              </PrivateRoute>
            }
          />
          {/* #chatsystem - Real-time chat route */}
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <Messages />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </Elements>
  )
}

export default App
