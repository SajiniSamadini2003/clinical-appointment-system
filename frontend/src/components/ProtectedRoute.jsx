import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute component
 * Ensures that only authenticated users with allowed roles can access specific routes.
 * Handles the initial authentication check gracefully before redirecting.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth()

  // 1. Wait until AuthContext finishes validating any saved JWT
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-3 text-gray-500 font-medium">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // 2. If unauthenticated, redirect to login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // 3. If authenticated user has the wrong role, redirect to their role-specific dashboard or home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath()} replace />
  }

  // 4. User is authenticated and authorized
  return children
}

export default ProtectedRoute
