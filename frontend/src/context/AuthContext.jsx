import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('access_token'))

  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Silently clear auth state (no toast) when token is invalid/expired
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setToken(null)
      setUser(null)
      delete axios.defaults.headers.common['Authorization']
    } finally {
      // Always resolve loading so ProtectedRoute never gets stuck
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { access_token, refresh_token } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      toast.success('Logged in successfully!')
      return true
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed')
      return false
    }
  }

  const register = async (userData) => {
    try {
      await axios.post('/api/auth/register', userData)
      // Don't toast here — auto-login will show "Logged in successfully!"
      return true
    } catch (error) {
      let errMsg = 'Registration failed';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errMsg = error.response.data.detail[0].msg;
        } else {
          errMsg = error.response.data.detail;
        }
      }
      toast.error(errMsg)
      return false
    }
  }

  /**
   * loginWithGoogle – called after Google Identity Services returns an id_token.
   * Sends the id_token to the backend which verifies it with Google's tokeninfo API
   * and returns our own JWT access/refresh tokens.
   */
  const loginWithGoogle = async (idToken) => {
    try {
      const response = await axios.post('/api/auth/google', { id_token: idToken })
      const { access_token, refresh_token } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      toast.success('Signed in with Google!')
      return true
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Google sign-in failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}