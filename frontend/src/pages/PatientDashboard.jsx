import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  getTodayDateString,
  formatDisplayDate,
  formatDisplayTime
} from '../utils/dateUtils'

const PatientDashboard = () => {
  const { user } = useAuth()
  const todayStr = getTodayDateString()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  // 1. Fetch patient's appointments from backend
  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      // GET /api/appointments/my
      const response = await api.get('/appointments/my')
      setAppointments(response.data || [])
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to fetch appointments. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // 2. Handle Appointment Cancellation
  const handleCancelAppointment = async (appointment) => {
    // Cancellation is strictly allowed only for PENDING and CONFIRMED
    if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
      return
    }

    const doctorName = appointment.doctor?.user?.name || 'your doctor'
    const confirmMessage = `Are you sure you want to cancel your appointment with ${doctorName} on ${appointment.date} at ${formatDisplayTime(
      appointment.time
    )}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setCancellingId(appointment._id)
    setActionSuccess('')
    setError('')

    try {
      // PUT /api/appointments/:id/cancel
      const response = await api.put(`/appointments/${appointment._id}/cancel`)
      setActionSuccess(response.data?.message || 'Appointment cancelled successfully.')

      // Refresh appointments from server
      await fetchAppointments()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to cancel appointment. Please try again.'
      )
    } finally {
      setCancellingId(null)
    }
  }

  // 3. Separate into Upcoming and Past Appointments

  // 3b. Delete cancelled appointment handler
  const handleDeleteCancelled = async (appointment) => {
    if (appointment.status !== 'CANCELLED') return;
    const confirmMessage = `Are you sure you want to delete this cancelled appointment on ${appointment.date} at ${formatDisplayTime(appointment.time)}?`;
    if (!window.confirm(confirmMessage)) return;
    setCancellingId(appointment._id);
    setError('');
    setActionSuccess('');
    try {
      const response = await api.delete(`/appointments/${appointment._id}`);
      setActionSuccess(response.data?.message || 'Cancelled appointment deleted successfully.');
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  // Upcoming: Today or future date AND active status (PENDING or CONFIRMED)
  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        apt.date >= todayStr &&
        apt.status !== 'CANCELLED' &&
        apt.status !== 'COMPLETED'
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  // Past / History: Past dates OR already COMPLETED or CANCELLED
  const pastAppointments = appointments
    .filter(
      (apt) =>
        apt.date < todayStr ||
        apt.status === 'CANCELLED' ||
        apt.status === 'COMPLETED'
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  // 4. Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Pending Confirmation
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Confirmed
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  // Helper component to render an appointment card
  const renderAppointmentCard = (apt, isUpcoming) => {
    const doctorName = apt.doctor?.user?.name || 'Dr. Medical Specialist'
    const specialization = apt.doctor?.specialization || 'General Consultation'
    const canCancel = apt.status === 'PENDING' || apt.status === 'CONFIRMED'
    const isThisCancelling = cancellingId === apt._id

    return (
      <div
        key={apt._id}
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        {/* Left Side: Details */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-bold text-gray-800">{doctorName}</h4>
            <span className="text-xs font-medium text-primary bg-teal-50 px-2 py-0.5 rounded">
              {specialization}
            </span>
            {getStatusBadge(apt.status)}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Date:</span>
              <span className="font-semibold text-gray-800">
                {formatDisplayDate(apt.date)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Time:</span>
              <span className="font-semibold text-gray-800">
                {formatDisplayTime(apt.time)}
              </span>
            </div>

            {apt.doctor?._id && (
              <Link
                to={`/doctors/${apt.doctor._id}`}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Doctor Profile &rarr;
              </Link>
            )}
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-700">Reason: </span>
            <span>{apt.reason}</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        {isUpcoming && canCancel && (
          <div className="flex md:flex-col justify-end items-end gap-2">
            <button
              onClick={() => handleCancelAppointment(apt)}
              disabled={isThisCancelling}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                isThisCancelling
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-rose-600 border-rose-200 bg-rose-50/40 hover:bg-rose-100 hover:border-rose-300'
              }`}
            >
              {isThisCancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome back, {user?.name || 'Patient'}!
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your medical appointments, track booking statuses, and connect with doctors.
          </p>
        </div>

        {/* Browse Doctors Button */}
        <Link
          to="/doctors"
          className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-teal-700 transition shadow-sm whitespace-nowrap"
        >
          Browse Doctors
        </Link>
      </div>

      {/* Action Notification Messages */}
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading your appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        /* Empty State: No appointments at all */
        <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-secondary text-primary rounded-full flex items-center justify-center text-2xl font-bold">
            📅
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Appointments Found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            You don&apos;t have any scheduled appointments yet. Browse our clinic doctors to
            book your first visit.
          </p>
          <Link
            to="/doctors"
            className="inline-block px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-teal-700 transition"
          >
            Find a Doctor
          </Link>
        </div>
      ) : (
        /* Appointments Sections */
        <div className="space-y-8">
          {/* Section 1: Upcoming Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Upcoming Appointments ({upcomingAppointments.length})
              </h2>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                No upcoming appointments scheduled at this moment.{' '}
                <Link to="/doctors" className="text-primary font-medium hover:underline">
                  Book a new consultation &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => renderAppointmentCard(apt, true))}
              </div>
            )}
          </div>

          {/* Section 2: Appointment History (Past, Completed, Cancelled) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Appointment History ({pastAppointments.length})
              </h2>
            </div>

            {pastAppointments.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                No past or cancelled appointments in your record.
              </div>
            ) : (
              <div className="space-y-3">
                {pastAppointments.map((apt) => renderAppointmentCard(apt, false))}

{/* Add Delete button for cancelled appointments */}
{pastAppointments.map((apt) => (
  <div key={apt._id} className="flex items-center justify-between">
    {apt.status === 'CANCELLED' && (
      <button
        onClick={() => handleDeleteCancelled(apt)}
        className="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
      >
        Delete
      </button>
    )}
  </div>
))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
