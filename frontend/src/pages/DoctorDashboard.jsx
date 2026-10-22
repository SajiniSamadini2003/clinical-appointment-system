import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  getTodayDateString,
  formatDisplayDate,
  formatDisplayTime
} from '../utils/dateUtils'

const DoctorDashboard = () => {
  const { user } = useAuth()
  const todayStr = getTodayDateString()

  // Appointments state
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState('')

  // Availability / Doctor profile state
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [newSlot, setNewSlot] = useState('')
  const [slotInputError, setSlotInputError] = useState('')
  const [isSavingSlots, setIsSavingSlots] = useState(false)
  const [slotSaveSuccess, setSlotSaveSuccess] = useState('')

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')

  // Filter state for All Appointments section
  const [statusFilter, setStatusFilter] = useState('All')

  // 1. Fetch Doctor's Appointments from backend
  const fetchDoctorAppointments = async () => {
    setLoadingAppointments(true)
    setAppointmentsError('')
    try {
      // GET /api/appointments/doctor (JWT attached by Axios interceptor)
      const response = await api.get('/appointments/doctor')
      setAppointments(response.data || [])
    } catch (err) {
      setAppointmentsError(
        err.response?.data?.message || 'Failed to fetch doctor appointments.'
      )
    } finally {
      setLoadingAppointments(false)
    }
  }

  // 2. Fetch Doctor's Own Profile & Availability
  const fetchDoctorProfile = async () => {
    setLoadingProfile(true)
    setProfileError('')
    try {
      // GET /api/doctors/me
      const response = await api.get('/doctors/me')
      setAvailableSlots(response.data?.availableSlots || [])
    } catch (err) {
      setProfileError(
        err.response?.data?.message || 'Failed to load doctor profile and availability.'
      )
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchDoctorAppointments()
    fetchDoctorProfile()
  }, [])

  // 3. Appointment Statistics (Calculated via simple JS array filtering)
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length
  }

  // 4. Upcoming Appointments (Status PENDING or CONFIRMED, date >= today, sorted)
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        a.date >= todayStr &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  // 5. Filtered Appointments for "All Appointments" list
  const filteredAppointments = appointments
    .filter((a) => {
      if (statusFilter === 'All') return true
      return a.status === statusFilter.toUpperCase()
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  // 6. Handle Appointment Status Update (Confirm or Complete)
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setActionLoadingId(appointmentId)
    setActionSuccess('')
    setActionError('')

    try {
      // PUT /api/appointments/:id/status
      await api.put(`/appointments/${appointmentId}/status`, {
        status: newStatus
      })

      setActionSuccess(
        newStatus === 'CONFIRMED'
          ? 'Appointment confirmed successfully.'
          : 'Appointment marked as completed.'
      )

      // Refresh appointments to update lists and statistics
      await fetchDoctorAppointments()
    } catch (err) {
      setActionError(
        err.response?.data?.message || 'Failed to update appointment status.'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  // 7. Availability Management Handlers
  const handleAddSlot = (e) => {
    e.preventDefault()
    setSlotInputError('')
    setSlotSaveSuccess('')

    if (!newSlot) {
      setSlotInputError('Please select a time.')
      return
    }

    // Validate HH:MM format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(newSlot)) {
      setSlotInputError('Invalid time format, expected HH:MM.')
      return
    }

    // Check duplicate
    if (availableSlots.includes(newSlot)) {
      setSlotInputError('This time slot is already added.')
      return
    }

    // Add and sort in ascending order
    const updated = [...availableSlots, newSlot].sort()
    setAvailableSlots(updated)
    setNewSlot('')
  }

  const handleRemoveSlot = (slotToRemove) => {
    setSlotInputError('')
    setSlotSaveSuccess('')
    const updated = availableSlots.filter((slot) => slot !== slotToRemove)
    setAvailableSlots(updated)
  }

  const handleSaveAvailability = async () => {
    setIsSavingSlots(true)
    setSlotInputError('')
    setSlotSaveSuccess('')

    try {
      // PUT /api/doctors/me/availability
      const response = await api.put('/doctors/me/availability', {
        availableSlots
      })
      setAvailableSlots(response.data?.availableSlots || availableSlots)
      setSlotSaveSuccess('Daily availability updated successfully!')
    } catch (err) {
      setSlotInputError(
        err.response?.data?.message || 'Failed to save availability settings.'
      )
    } finally {
      setIsSavingSlots(false)
    }
  }

  // Helper for Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Confirmed
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  // Render Appointment Card Component
  const renderAppointmentItem = (apt) => {
    const isProcessing = actionLoadingId === apt._id

    return (
      <div
        key={apt._id}
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="text-base font-bold text-gray-800">
              {apt.patient?.name || 'Patient'}
            </h4>
            {getStatusBadge(apt.status)}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
            <div>
              <span className="text-gray-400">Date: </span>
              <span className="font-semibold text-gray-800">
                {formatDisplayDate(apt.date)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Time: </span>
              <span className="font-semibold text-gray-800">
                {formatDisplayTime(apt.time)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Phone: </span>
              <span className="font-medium text-gray-700">
                {apt.patient?.phone || 'Not provided'}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mt-1">
            <span className="font-semibold text-gray-700">Reason: </span>
            <span>{apt.reason}</span>
          </div>
        </div>

        {/* Action Buttons for Allowed Transitions */}
        <div className="flex sm:flex-col items-end justify-end gap-2">
          {apt.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus(apt._id, 'CONFIRMED')}
              disabled={isProcessing}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition ${
                isProcessing
                  ? 'bg-primary/50 cursor-not-allowed'
                  : 'bg-primary hover:bg-teal-700 shadow-sm'
              }`}
            >
              {isProcessing ? 'Updating...' : 'Confirm Appointment'}
            </button>
          )}

          {apt.status === 'CONFIRMED' && (
            <button
              onClick={() => handleUpdateStatus(apt._id, 'COMPLETED')}
              disabled={isProcessing}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition ${
                isProcessing
                  ? 'bg-emerald-600/50 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
              }`}
            >
              {isProcessing ? 'Updating...' : 'Mark as Completed'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, Dr. {user?.name || 'Doctor'}!
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your patient appointments, review schedules, and configure daily consultation hours.
          </p>
        </div>
      </div>

      {/* Global Action Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex justify-between items-center">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="text-red-700 hover:text-red-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Appointment Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Total Appointments
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
            Pending
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1 block">
            {stats.pending}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-sm">
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
            Confirmed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-sky-700 mt-1 block">
            {stats.confirmed}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1 block">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Main Grid: Appointments on Left, Availability Management on Right */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming & All Appointments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Upcoming Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Upcoming Appointments ({upcomingAppointments.length})
              </h2>
            </div>

            {loadingAppointments ? (
              <div className="p-8 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2"></div>
                <p>Loading appointments...</p>
              </div>
            ) : appointmentsError ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {appointmentsError}
                <button
                  onClick={fetchDoctorAppointments}
                  className="block mt-2 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                No upcoming appointments pending or confirmed.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => renderAppointmentItem(apt))}
              </div>
            )}
          </div>

          {/* Section: All Appointments with Status Filtering */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                All Appointments ({filteredAppointments.length})
              </h2>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(
                  (tab) => {
                    const isActive = statusFilter === tab
                    return (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {loadingAppointments ? (
              <div className="p-8 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2"></div>
                <p>Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                No {statusFilter === 'All' ? '' : statusFilter.toLowerCase()} appointments
                found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => renderAppointmentItem(apt))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Availability Settings */}
        <div className="h-fit space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-1 border-b pb-2">
              Availability Settings
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure your daily consultation hours. Patients can book only within these configured slots.
            </p>

            {/* Notification messages for slot updates */}
            {slotSaveSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                {slotSaveSuccess}
              </div>
            )}

            {slotInputError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {slotInputError}
              </div>
            )}

            {profileError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {profileError}
              </div>
            )}

            {/* Add Slot Form */}
            <form onSubmit={handleAddSlot} className="flex gap-2 mb-5">
              <input
                type="time"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-secondary text-primary font-semibold text-xs rounded-lg hover:bg-sky-200 transition"
              >
                + Add
              </button>
            </form>

            {/* Currently Configured Slots List */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Configured Slots ({availableSlots.length})
              </span>

              {loadingProfile ? (
                <p className="text-xs text-gray-400 py-3 text-center">
                  Loading slots...
                </p>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs text-gray-500">
                  No slots configured yet. Add your working hours above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-primary text-xs font-semibold rounded-lg"
                    >
                      <span>{formatDisplayTime(slot)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot)}
                        className="text-teal-700 hover:text-red-600 font-bold text-sm ml-1 leading-none"
                        title={`Remove ${slot}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Availability Button */}
            <button
              type="button"
              onClick={handleSaveAvailability}
              disabled={isSavingSlots || loadingProfile}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition ${
                isSavingSlots || loadingProfile
                  ? 'bg-primary/50 cursor-not-allowed'
                  : 'bg-primary hover:bg-teal-700 shadow-sm'
              }`}
            >
              {isSavingSlots ? 'Saving Availability...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
