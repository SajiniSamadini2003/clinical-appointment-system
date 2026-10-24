import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = () => {
    if (!user?.role) return '/';
    switch (user.role) {
      case 'PATIENT':
        return '/patient/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <footer className="bg-primary text-white py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="text-center md:text-left">
          <p className="font-semibold">© {new Date().getFullYear()} CareClinic. All rights reserved.</p>
          <p className="text-sm text-secondary">Quality healthcare scheduling solutions.</p>
        </div>
        <nav className="flex space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/doctors" className="hover:underline">Doctors</Link>
          {isAuthenticated ? (
            <Link to={dashboardPath()} className="hover:underline">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
