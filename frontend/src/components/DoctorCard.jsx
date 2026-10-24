import { Link } from 'react-router-dom'

const PLACEHOLDER = '/doctor-placeholder.svg'

/**
 * Reusable DoctorCard component
 * Displays doctor profile overview and links to DoctorDetails page using doctor._id
 */
const DoctorCard = ({ doctor }) => {
  const doctorName = doctor.user?.name || 'Dr. Medical Specialist'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col p-6">
      <div className="flex items-start gap-4 mb-4">
        {/* Profile Image with reliable placeholder fallback */}
        <img
          src={doctor.profileImage || PLACEHOLDER}
          alt={doctorName}
          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate" title={doctorName}>
            {doctorName}
          </h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-primary text-xs font-semibold rounded-full">
            {doctor.specialization}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Qualification:</span>
          <span className="font-medium text-gray-800 text-right truncate ml-2">
            {doctor.qualification}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Experience:</span>
          <span className="font-medium text-gray-800">
            {doctor.experience} {doctor.experience === 1 ? 'Year' : 'Years'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Consultation Fee:</span>
          <span className="font-semibold text-primary">
            Rs. {Number(doctor.consultationFee).toLocaleString('en-LK')}
          </span>
        </div>
      </div>

      {/* View Details Action Button (Uses doctor._id) */}
      <div className="mt-5 pt-2">
        <Link
          to={`/doctors/${doctor._id}`}
          className="block w-full text-center bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

export default DoctorCard
