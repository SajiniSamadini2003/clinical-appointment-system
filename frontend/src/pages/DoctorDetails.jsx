import { useParams, Link } from 'react-router-dom'

const DoctorDetails = () => {
  const { id } = useParams()

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
        <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center text-primary text-4xl font-bold flex-shrink-0">
          Dr
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Doctor Profile {id}</h2>
          <p className="text-xl text-primary mb-2">Specialization Placeholder</p>
          <p className="text-gray-600">Qualifications: MBBS, MD (Placeholder)</p>
          <p className="text-gray-600">Experience: 10 years (Placeholder)</p>
          <p className="text-gray-600">Fee: $100 (Placeholder)</p>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-xl font-semibold mb-4">Book an Appointment</h3>
        <p className="text-gray-500 mb-6">Select a date and time to book your appointment. (Functionality coming soon)</p>
        
        <div className="bg-gray-50 p-6 rounded text-center text-gray-500 border border-gray-200">
          [ Date/Time Picker Placeholder ]
        </div>
        
        <div className="mt-6 flex justify-end gap-4">
          <Link to="/doctors" className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
            Back to Doctors
          </Link>
          <button className="px-6 py-2 bg-primary text-white rounded font-medium opacity-50 cursor-not-allowed">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoctorDetails
