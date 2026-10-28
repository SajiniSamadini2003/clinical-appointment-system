import axios from 'axios'

// Create a single Axios instance for the entire app.
// baseURL is read from the VITE_API_URL environment variable so we can
// switch between local dev and a deployed backend without changing code.
// The fallback 'http://localhost:5000/api' works for local development.
const api = axios.create({
  // Ensure baseURL does not end with a trailing slash to avoid duplicate slashes when concatenating paths.
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '')
})

// --- Request interceptor ---
// Before every outgoing request, check if a JWT exists in localStorage.
// If it does, attach it to the Authorization header so the backend's
// `protect` middleware can verify the user's identity.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// --- Response interceptor ---
// If any request returns 401 (Unauthorized), the token has expired or is
// invalid. Clear the stored credentials and redirect to the login page so
// the user gets a clean session rather than seeing confusing error messages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we had a token stored (i.e. the session expired).
      // Skip for the login request itself to avoid redirect loops.
      const hadToken = !!localStorage.getItem('token')
      const isLoginRequest = error.config?.url?.includes('/auth/login')

      if (hadToken && !isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Redirect to login – use window.location so React Router state
        // is fully reset alongside the cleared auth state.
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
