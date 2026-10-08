import axios from 'axios'

// Create a single Axios instance for the entire app.
// baseURL is read from the VITE_API_URL environment variable so we can
// switch between local dev and a deployed backend without changing code.
// The fallback 'http://localhost:5000/api' works for local development.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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

export default api
