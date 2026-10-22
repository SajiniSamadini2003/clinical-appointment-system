import { useState, useEffect } from 'react'
import api from '../services/api'
import DoctorCard from '../components/DoctorCard'

const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Fetch doctors on component mount
  const fetchDoctors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/doctors')
      setDoctors(response.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load doctors. Please ensure the server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  // Filter doctors by name or specialization using frontend JavaScript
  const filteredDoctors = doctors.filter((doc) => {
    const query = search.trim().toLowerCase()
    if (!query) return true

    const name = doc.user?.name?.toLowerCase() || ''
    const specialization = doc.specialization?.toLowerCase() || ''

    return name.includes(query) || specialization.includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Our Doctors</h1>
          <p className="text-gray-600 mt-1">
            Browse our verified medical specialists and book your consultation.
          </p>
        </div>

        {/* Simple Search Input */}
        <div className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialization..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-semibold"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading doctors...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchDoctors}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Doctor Cards Grid */}
      {!loading && !error && (
        <>
          {doctors.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary text-primary rounded-full flex items-center justify-center text-2xl font-bold">
                Dr
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Doctors Available
              </h3>
              <p className="text-gray-500 text-sm">
                There are currently no doctors registered in the system.
              </p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Matching Doctors
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                No doctors matched your search for &quot;{search}&quot;.
              </p>
              <button
                onClick={() => setSearch('')}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-teal-700 transition"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Doctors
