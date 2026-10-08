import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          CareClinic
        </Link>
        <nav className="space-x-6">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <Link to="/doctors" className="hover:text-secondary transition-colors">Doctors</Link>
          <Link to="/login" className="hover:text-secondary transition-colors">Login</Link>
          <Link to="/register" className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-secondary transition-colors">Register</Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
