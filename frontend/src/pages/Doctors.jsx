import { Link } from 'react-router-dom'

const Doctors = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Doctors</h2>
      <p className="text-gray-600 mb-8">Browse our list of healthcare professionals and specialists.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        {[1, 2, 3, 4].map(id => (
          <div key={id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-secondary rounded-full mb-4 flex items-center justify-center text-primary text-2xl font-bold">
              Dr
            </div>
            <h3 className="text-xl font-semibold mb-1">Doctor Name Placeholder {id}</h3>
            <p className="text-gray-500 mb-4">Specialization Placeholder</p>
            <Link to={`/doctors/${id}`} className="mt-auto bg-primary text-white px-4 py-2 rounded text-sm hover:bg-teal-700 transition-colors">
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Doctors
