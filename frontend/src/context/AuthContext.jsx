import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Configure axios base URL for backend
// In development with Vite proxy, we don't need to set a full URL - just use /api
// In production, use the API URL from env or derive from current location
if (import.meta.env.PROD) {
  // Use env variable if set, otherwise replace frontend domain with backend domain
  // For Render: https://stayspace-gf6a.onrender.com -> https://stayspace-backend.onrender.com
  let apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl || apiUrl === 'http://localhost:5000') {
    const currentUrl = window.location.origin
    // If it's our Render frontend, construct the backend URL
    if (currentUrl.includes('render.com')) {
      apiUrl = currentUrl.replace('stayspace-gf6a', 'stayspace-backend')
    } else {
      apiUrl = 'http://localhost:5000'
    }
  }
  axios.defaults.baseURL = apiUrl
}

// Add debug logging for all axios requests
axios.interceptors.request.use((config) => {
  console.log('API Request:', config.method.toUpperCase(), config.url)
  return config
})

axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.method.toUpperCase(), error.config?.url, error.response?.status, error.message)
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('stayspaceUser')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setUser(data)
    localStorage.setItem('stayspaceUser', JSON.stringify(data))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  // 2-STEP VERIFICATION FEATURE — Register sends code to email
  const register = async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData)
    // Return user info (not logged in yet, needs verification)
    return data
  }

  // 2-STEP VERIFICATION FEATURE — Verify code and complete registration
  const verifyCode = async (email, code) => {
    const { data } = await axios.post('/api/auth/verify-code', { email, code })
    setUser(data)
    localStorage.setItem('stayspaceUser', JSON.stringify(data))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  // 2-STEP VERIFICATION FEATURE — Resend verification code
  const resendCode = async (email) => {
    const { data } = await axios.post('/api/auth/resend-code', { email })
    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('stayspaceUser')
    delete axios.defaults.headers.common['Authorization']
  }

  // Arman — calls PUT /api/auth/profile and syncs updated fields back to state + localStorage
  const updateUser = async (fields) => {
    const { data } = await axios.put('/api/auth/profile', fields)
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('stayspaceUser', JSON.stringify(updated))
    return updated
  }

  const getWishlist = async () => {
    const { data } = await axios.get('/api/tenant/wishlist')
    return data
  }

  const addToWishlist = async (propertyId) => {
    const { data } = await axios.post(`/api/tenant/wishlist/${propertyId}`)
    return data
  }

  const removeFromWishlist = async (propertyId) => {
    const { data } = await axios.delete(`/api/tenant/wishlist/${propertyId}`)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, login, register, verifyCode, resendCode, logout, updateUser, loading, getWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
