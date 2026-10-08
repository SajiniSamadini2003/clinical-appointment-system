import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 mt-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
        Welcome to CareClinic
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl">
        Your health is our priority. Book your appointments easily with our expert doctors and manage your healthcare journey in one place.
      </p>
      
      <div className="flex space-x-4">
        <Link to="/doctors" className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-teal-700 transition-colors">
          Browse Doctors
        </Link>
        <Link to="/login" className="bg-secondary text-primary px-6 py-3 rounded-md font-medium hover:bg-blue-100 transition-colors">
          Login to Account
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-16 w-full">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-3 text-primary">Expert Doctors</h3>
          <p className="text-gray-600">Choose from a wide range of specialized professionals ready to help you.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-3 text-primary">Easy Booking</h3>
          <p className="text-gray-600">Select your preferred date and time, and confirm your appointment instantly.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-3 text-primary">Manage History</h3>
          <p className="text-gray-600">Keep track of your past and upcoming appointments right from your dashboard.</p>
        </div>
      </div>
    </div>
  )
}

export default Home
