import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-6xl font-bold text-primary mb-4">404</h2>
      <h3 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h3>
      <p className="text-gray-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-teal-700 transition-colors">
        Return to Home
      </Link>
    </div>
  )
}

export default NotFound
