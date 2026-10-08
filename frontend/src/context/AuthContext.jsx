import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

// Create the context object that will hold authentication state.
const AuthContext = createContext(null)

// Custom hook so any component can access auth state with useAuth().
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider wraps the entire app and makes auth state available
// to every component via React Context.
export const AuthProvider = ({ children }) => {
  // ---- state ----
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true) // true while we verify saved auth

  // Derived boolean – true when we have both a token and user object.
  const isAuthenticated = !!token && !!user

  // ---- restore session on first render ----
  // When the page is refreshed the React state is lost, but the JWT and
  // basic user info survive in localStorage.  We restore them here and
  // then *validate* the token against the backend's /api/test/profile
  // endpoint so that expired or tampered tokens are caught immediately.
  //
  // NOTE:  localStorage is a simple, beginner-friendly storage choice.
  //        It is accessible to any JavaScript running on the page, which
  //        means an XSS vulnerability could expose the token.  In a
  //        production app you would typically use httpOnly cookies instead.
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (!savedToken || !savedUser) {
        // Nothing saved → definitely logged out.
        setLoading(false)
        return
      }

      try {
        // Temporarily set the token so the Axios interceptor sends it.
        setToken(savedToken)

        // Validate the token with the backend.
        const response = await api.get('/test/profile', {
          headers: { Authorization: `Bearer ${savedToken}` }
        })

        // The backend returned the user successfully → token is still valid.
        // Use the fresh user data from the server (not the stale localStorage copy).
        const verifiedUser = response.data.user
        setUser(verifiedUser)
        // Update localStorage with the freshest data.
        localStorage.setItem('user', JSON.stringify(verifiedUser))
      } catch {
        // Token is expired, invalid, or the server is unreachable.
        // Clear everything so the UI doesn't show an incorrectly
        // authenticated state.
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, []) // empty dependency array → run once on mount

  // ---- login ----
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = response.data

    // Persist to localStorage so the session survives page refresh.
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    setToken(newToken)
    setUser(newUser)

    return newUser // caller uses .role for redirect
  }

  // ---- register ----
  const register = async (name, email, phone, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      phone,
      password
    })
    const { token: newToken, user: newUser } = response.data

    // The backend returns a token on registration → log in directly.
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    setToken(newToken)
    setUser(newUser)

    return newUser
  }

  // ---- logout ----
  const logout = async () => {
    // Optionally tell the backend (it doesn't invalidate the JWT
    // server-side in this stateless implementation, but we call it
    // for completeness).
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors – the important part is clearing local state.
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // ---- helper: get dashboard path for current user ----
  const getDashboardPath = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'PATIENT':
        return '/patient/dashboard'
      case 'DOCTOR':
        return '/doctor/dashboard'
      case 'ADMIN':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  // ---- provide state to the tree ----
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated,
        loading,
        getDashboardPath
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
