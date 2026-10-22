import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getTodayDateString, formatDisplayTime } from '../utils/dateUtils'

const DoctorDetails = () => {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()

  // Doctor state
  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [doctorError, setDoctorError] = useState('')

  // Booking & Slots state
  const todayStr = getTodayDateString()
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [hasFetchedSlots, setHasFetchedSlots] = useState(false)

  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [bookingError, setBookingError] = useState('')

  // Ref to track latest requested date to ignore stale out-of-order API responses
  const activeDateRef = useRef('')

  // Reset booking form state if doctor ID changes
  useEffect(() => {
    setSelectedDate('')
    setAvailableSlots([])
    setSelectedTime('')
    setHasFetchedSlots(false)
    setBookingSuccess('')
    setBookingError('')
  }, [id])

  // 1. Fetch Doctor Details
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoadingDoctor(true)
      setDoctorError('')
      try {
        const response = await api.get(`/doctors/${id}`)
        setDoctor(response.data)
      } catch (err) {
        setDoctorError(
          err.response?.data?.message || 'Doctor not found or unable to load details.'
        )
      } finally {
        setLoadingDoctor(false)
      }
    }

    if (id) {
      fetchDoctor()
    }
  }, [id])

  // 2. Fetch Available Slots for a given date
  const fetchAvailableSlots = useCallback(
    async (date) => {
      if (!id || !date) return

      activeDateRef.current = date
      setLoadingSlots(true)
      setSlotsError('')
      setHasFetchedSlots(true)

      try {
        const response = await api.get(`/doctors/${id}/available-slots`, {
          params: { date, _t: Date.now() }
        })
        // Only update state if this response corresponds to the latest requested date
        if (activeDateRef.current === date) {
          setAvailableSlots(response.data?.availableSlots || [])
        }
      } catch (err) {
        if (activeDateRef.current === date) {
          setSlotsError(
            err.response?.data?.message || 'Failed to load available slots for this date.'
          )
          setAvailableSlots([])
        }
      } finally {
        if (activeDateRef.current === date) {
          setLoadingSlots(false)
        }
      }
    },
    [id]
  )

  // 3. Handle Date Selection Change
  const handleDateChange = (e) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    setSelectedTime('') // Clear previously selected time
    setBookingSuccess('')
    setBookingError('')

    if (newDate) {
      fetchAvailableSlots(newDate)
    } else {
      setAvailableSlots([])
      setHasFetchedSlots(false)
    }
  }

  // 4. Handle Appointment Booking Form Submit
  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingSuccess('')
    setBookingError('')

    // Client-side validations
    if (!selectedDate) {
      setBookingError('Please select an appointment date.')
      return
    }
    if (!selectedTime) {
      setBookingError('Please choose an available appointment time.')
      return
    }
    if (!reason.trim()) {
      setBookingError('Please provide a reason for the consultation.')
      return
    }

    setIsBooking(true)

    try {
      // POST /api/appointments
      // Note: Patient ID is derived from JWT by backend protect middleware
      // Status is automatically set to PENDING by backend
      await api.post('/appointments', {
        doctor: id,
        date: selectedDate,
        time: selectedTime,
        reason: reason.trim()
      })

      setBookingSuccess('Appointment booked successfully! It is pending doctor confirmation.')
      setSelectedTime('')
      setReason('')

      // Refresh slots for the chosen date so booked slot is immediately removed
      await fetchAvailableSlots(selectedDate)
    } catch (err) {
      if (err.response?.status === 409) {
        setBookingError(
          'This appointment time has already been booked. Please choose another time.'
        )
        // Refresh slots in case someone else just took that slot
        await fetchAvailableSlots(selectedDate)
      } else {
        setBookingError(
          err.response?.data?.message || 'Failed to book appointment. Please try again.'
        )
      }
    } finally {
      setIsBooking(false)
    }
  }

  // Loading Doctor State
  if (loadingDoctor) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading doctor profile...</p>
      </div>
    )
  }

  // Error Doctor State
  if (doctorError || !doctor) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Doctor Profile Unavailable</h2>
        <p className="text-gray-600 mb-6">{doctorError || 'Doctor not found.'}</p>
        <Link
          to="/doctors"
          className="inline-block px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-teal-700 transition"
        >
          &larr; Back to Doctors
        </Link>
      </div>
    )
  }

  const doctorName = doctor.user?.name || 'Dr. Medical Professional'
  const initials = doctorName
    .replace('Dr.', '')
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          &larr; Back to all doctors
        </Link>
      </div>

      {/* Doctor Profile Overview Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Profile Image or Placeholder */}
        {doctor.profileImage ? (
          <img
            src={doctor.profileImage}
            alt={doctorName}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0 border-4 border-primary/20 shadow-sm">
            {initials || 'DR'}
          </div>
        )}

        {/* Doctor Information */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{doctorName}</h1>
              <p className="text-primary font-semibold text-lg">{doctor.specialization}</p>
            </div>
            <div className="bg-secondary/60 px-4 py-2 rounded-lg border border-teal-100 self-center md:self-auto">
              <span className="text-xs text-gray-500 uppercase tracking-wider block">
                Consultation Fee
              </span>
              <span className="text-2xl font-bold text-primary">
                ${doctor.consultationFee}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm text-gray-600 border-t border-gray-100">
            <div>
              <span className="text-gray-400 block text-xs uppercase">Qualification</span>
              <span className="font-medium text-gray-800">{doctor.qualification}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase">Experience</span>
              <span className="font-medium text-gray-800">
                {doctor.experience} {doctor.experience === 1 ? 'Year' : 'Years'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase">Phone Contact</span>
              <span className="font-medium text-gray-800">
                {doctor.user?.phone || 'Not available'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase">Email</span>
              <span className="font-medium text-gray-800 truncate block">
                {doctor.user?.email || 'Not available'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase">Doctor ID</span>
              <span className="font-mono text-xs text-gray-500">{doctor._id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Booking Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book an Appointment</h2>
        <p className="text-gray-500 text-sm mb-6">
          Select a date to check doctor availability and schedule your consultation.
        </p>

        {/* Condition 1: Visitor is NOT logged in */}
        {!isAuthenticated && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Patient Login Required
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              You must be logged in as a registered patient to book an appointment with {doctorName}.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-teal-700 transition"
              >
                Log In to Book
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Create Patient Account
              </Link>
            </div>
          </div>
        )}

        {/* Condition 2: Authenticated user is DOCTOR or ADMIN */}
        {isAuthenticated && user?.role !== 'PATIENT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-amber-800 mb-1">
              Booking Restricted
            </h3>
            <p className="text-amber-700 text-sm">
              You are signed in as a <span className="font-bold">{user.role}</span>.
              Patient appointment booking is only available for patient accounts.
            </p>
          </div>
        )}

        {/* Condition 3: Authenticated user is PATIENT */}
        {isAuthenticated && user?.role === 'PATIENT' && (
          <form onSubmit={handleBooking} className="space-y-6">
            {/* Feedback Messages */}
            {bookingSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                <p className="font-semibold">{bookingSuccess}</p>
                <div className="mt-2">
                  <Link
                    to="/patient/dashboard"
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Go to Patient Dashboard &rarr;
                  </Link>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {bookingError}
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label
                htmlFor="appointment-date"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                1. Select Appointment Date:
              </label>
              <input
                id="appointment-date"
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={handleDateChange}
                required
                className="w-full sm:w-80 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                Appointments can only be booked for today or future dates.
              </p>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Select Available Time Slot:
              </label>

              {!selectedDate ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  Please select a date above to load the doctor&apos;s available slots.
                </div>
              ) : loadingSlots ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-3 text-gray-600 text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  <span>Checking doctor availability for {selectedDate}...</span>
                </div>
              ) : slotsError ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {slotsError}
                </div>
              ) : hasFetchedSlots && availableSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  No available appointments for this date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(slot)
                          setBookingError('')
                        }}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-teal-50/50'
                        }`}
                      >
                        {formatDisplayTime(slot)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Reason for Appointment */}
            <div>
              <label
                htmlFor="booking-reason"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                3. Reason for Consultation:
              </label>
              <textarea
                id="booking-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit..."
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  isBooking ||
                  !selectedDate ||
                  !selectedTime ||
                  !reason.trim()
                }
                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white transition ${
                  isBooking ||
                  !selectedDate ||
                  !selectedTime ||
                  !reason.trim()
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-teal-700 shadow-sm'
                }`}
              >
                {isBooking ? 'Booking Appointment...' : 'Confirm & Book Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default DoctorDetails
