import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout, getDashboardPath } = useAuth()
  const navigate = useNavigate()

  // Handle logout: clear state and navigate home
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          CareClinic
        </Link>
        <nav className="space-x-6 flex items-center">
          <Link to="/" className="hover:text-secondary transition-colors">
            Home
          </Link>
          <Link
            to="/doctors"
            className="hover:text-secondary transition-colors"
          >
            Doctors
          </Link>

          {isAuthenticated ? (
            <>
              {/* Dashboard link points to the role-specific dashboard */}
              <Link
                to={getDashboardPath()}
                className="hover:text-secondary transition-colors"
              >
                Dashboard
              </Link>

              {/* Show welcome text */}
              <span className="text-secondary text-sm hidden sm:inline">
                Hi, {user?.name?.split(' ')[0]}
              </span>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-secondary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-secondary transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
