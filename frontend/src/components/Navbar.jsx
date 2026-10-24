import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const linkClass = (path) =>
    `hover:text-secondary transition-colors ${location.pathname === path ? 'text-secondary font-semibold' : ''}`;

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          CareClinic
        </Link>
        {/* Mobile menu toggle button */}
        <button
          className="sm:hidden focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Navigation links */}
        <nav
          className={`space-x-6 flex items-center ${menuOpen ? 'flex-col absolute top-full left-0 w-full bg-primary p-4' : 'hidden sm:flex'}`}
          aria-label="Primary navigation"
        >
          <Link to="/" className={linkClass('/')}>Home</Link>
          <Link to="/doctors" className={linkClass('/doctors')}>Doctors</Link>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath()} className={linkClass(getDashboardPath())}>Dashboard</Link>
              <span className="text-secondary text-sm hidden sm:inline">Hi, {user?.name?.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-secondary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass('/login')}>Login</Link>
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
  );
};

export default Navbar;
