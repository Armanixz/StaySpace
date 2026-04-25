import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Configure axios base URL for backend
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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

  const register = async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData)
    setUser(data)
    localStorage.setItem('stayspaceUser', JSON.stringify(data))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
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
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading, getWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
