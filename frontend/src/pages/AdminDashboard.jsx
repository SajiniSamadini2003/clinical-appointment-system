import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDisplayDate, formatDisplayTime } from '../utils/dateUtils'

const AdminDashboard = () => {
  const { user } = useAuth()

  // Active tab state: 'doctors' | 'patients' | 'appointments'
  const [activeTab, setActiveTab] = useState('doctors')

  // Global notifications
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Data states
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorsError, setDoctorsError] = useState('')

  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [patientsError, setPatientsError] = useState('')

  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState('')

  // Doctor Form Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState(null)
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false)
  const [modalError, setModalError] = useState('')

  // Add Doctor Form Fields
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    consultationFee: '',
    availableSlots: [],
    profileImage: ''
  })
  const [newSlotAdd, setNewSlotAdd] = useState('')

  // Edit Doctor Form Fields
  const [editForm, setEditForm] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    consultationFee: '',
    availableSlots: [],
    profileImage: ''
  })
  const [newSlotEdit, setNewSlotEdit] = useState('')

  // Appointment filter & search states
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('ALL')
  const [appointmentSearch, setAppointmentSearch] = useState('')

  // Deleting Doctor ID state (disables button while processing)
  const [deletingDoctorId, setDeletingDoctorId] = useState(null)

  // 1. Fetch Doctors
  const fetchDoctors = async () => {
    setLoadingDoctors(true)
    setDoctorsError('')
    try {
      const response = await api.get('/doctors')
      setDoctors(response.data || [])
    } catch (err) {
      setDoctorsError(err.response?.data?.message || 'Failed to fetch doctors.')
    } finally {
      setLoadingDoctors(false)
    }
  }

  // 2. Fetch Patients (Admin endpoint)
  const fetchPatients = async () => {
    setLoadingPatients(true)
    setPatientsError('')
    try {
      const response = await api.get('/admin/patients')
      setPatients(response.data || [])
    } catch (err) {
      setPatientsError(err.response?.data?.message || 'Failed to fetch patients.')
    } finally {
      setLoadingPatients(false)
    }
  }

  // 3. Fetch All Appointments (Admin endpoint)
  const fetchAppointments = async () => {
    setLoadingAppointments(true)
    setAppointmentsError('')
    try {
      const response = await api.get('/appointments/all')
      setAppointments(response.data || [])
    } catch (err) {
      setAppointmentsError(err.response?.data?.message || 'Failed to fetch appointments.')
    } finally {
      setLoadingAppointments(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
    fetchPatients()
    fetchAppointments()
  }, [])

  // Statistics calculated from existing API responses
  const stats = {
    totalDoctors: doctors.length,
    totalPatients: patients.length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter((a) => a.status === 'PENDING').length
  }

  // -------------------------------------------------------------
  // Add Doctor Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      qualification: '',
      experience: '',
      consultationFee: '',
      availableSlots: ['09:00', '10:00', '11:00', '14:00'],
      profileImage: ''
    })
    setNewSlotAdd('')
    setModalError('')
    setIsAddModalOpen(true)
  }

  const handleAddSlotToAddForm = (e) => {
    e.preventDefault()
    if (!newSlotAdd) return
    if (!/^\d{2}:\d{2}$/.test(newSlotAdd)) {
      setModalError('Invalid time format, expected HH:MM.')
      return
    }
    if (addForm.availableSlots.includes(newSlotAdd)) {
      setModalError('Time slot already added.')
      return
    }
    setModalError('')
    setAddForm((prev) => ({
      ...prev,
      availableSlots: [...prev.availableSlots, newSlotAdd].sort()
    }))
    setNewSlotAdd('')
  }

  const handleRemoveSlotFromAddForm = (slotToRemove) => {
    setAddForm((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((s) => s !== slotToRemove)
    }))
  }

  const handleSubmitAddDoctor = async (e) => {
    e.preventDefault()
    setModalError('')

    // Validations
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      setModalError('Name, email, and password are required.')
      return
    }
    if (addForm.password.length < 6) {
      setModalError('Password must be at least 6 characters.')
      return
    }
    if (!addForm.specialization.trim() || !addForm.qualification.trim()) {
      setModalError('Specialization and qualification are required.')
      return
    }
    const exp = Number(addForm.experience)
    const fee = Number(addForm.consultationFee)
    if (isNaN(exp) || exp < 0) {
      setModalError('Experience must be a number greater than or equal to 0.')
      return
    }
    if (isNaN(fee) || fee < 0) {
      setModalError('Consultation fee must be a number greater than or equal to 0.')
      return
    }

    setIsSubmittingDoctor(true)

    try {
      await api.post('/doctors', {
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        phone: addForm.phone.trim(),
        specialization: addForm.specialization.trim(),
        qualification: addForm.qualification.trim(),
        experience: exp,
        consultationFee: fee,
        availableSlots: addForm.availableSlots,
        profileImage: addForm.profileImage.trim()
      })

      setSuccessMessage('Doctor created successfully!')
      setIsAddModalOpen(false)
      fetchDoctors()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create doctor.')
    } finally {
      setIsSubmittingDoctor(false)
    }
  }

  // -------------------------------------------------------------
  // Edit Doctor Handlers
  // -------------------------------------------------------------
  const handleOpenEditModal = (doctor) => {
    setSelectedDoctorForEdit(doctor)
    setEditForm({
      _id: doctor._id,
      name: doctor.user?.name || '',
      email: doctor.user?.email || '',
      phone: doctor.user?.phone || '',
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience ?? '',
      consultationFee: doctor.consultationFee ?? '',
      availableSlots: doctor.availableSlots ? [...doctor.availableSlots] : [],
      profileImage: doctor.profileImage || ''
    })
    setNewSlotEdit('')
    setModalError('')
    setIsEditModalOpen(true)
  }

  const handleAddSlotToEditForm = (e) => {
    e.preventDefault()
    if (!newSlotEdit) return
    if (!/^\d{2}:\d{2}$/.test(newSlotEdit)) {
      setModalError('Invalid time format, expected HH:MM.')
      return
    }
    if (editForm.availableSlots.includes(newSlotEdit)) {
      setModalError('Time slot already added.')
      return
    }
    setModalError('')
    setEditForm((prev) => ({
      ...prev,
      availableSlots: [...prev.availableSlots, newSlotEdit].sort()
    }))
    setNewSlotEdit('')
  }

  const handleRemoveSlotFromEditForm = (slotToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((s) => s !== slotToRemove)
    }))
  }

  const handleSubmitEditDoctor = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!editForm.name.trim() || !editForm.specialization.trim() || !editForm.qualification.trim()) {
      setModalError('Name, specialization, and qualification are required.')
      return
    }
    const exp = Number(editForm.experience)
    const fee = Number(editForm.consultationFee)
    if (isNaN(exp) || exp < 0) {
      setModalError('Experience must be a number greater than or equal to 0.')
      return
    }
    if (isNaN(fee) || fee < 0) {
      setModalError('Consultation fee must be a number greater than or equal to 0.')
      return
    }

    setIsSubmittingDoctor(true)

    try {
      await api.put(`/doctors/${editForm._id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        specialization: editForm.specialization.trim(),
        qualification: editForm.qualification.trim(),
        experience: exp,
        consultationFee: fee,
        availableSlots: editForm.availableSlots,
        profileImage: editForm.profileImage.trim()
      })

      setSuccessMessage('Doctor profile updated successfully!')
      setIsEditModalOpen(false)
      fetchDoctors()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update doctor.')
    } finally {
      setIsSubmittingDoctor(false)
    }
  }

  // -------------------------------------------------------------
  // Delete Doctor Handler
  // -------------------------------------------------------------
  const handleDeleteDoctor = async (doctor) => {
    const doctorName = doctor.user?.name || 'this doctor'
    const confirmMessage = `Are you sure you want to delete ${doctorName}? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setDeletingDoctorId(doctor._id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await api.delete(`/doctors/${doctor._id}`)
      setSuccessMessage(response.data?.message || 'Doctor deleted successfully.')
      fetchDoctors()
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMessage(
          err.response?.data?.message ||
            'This doctor has appointment records and cannot be deleted.'
        )
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to delete doctor.')
      }
    } finally {
      setDeletingDoctorId(null)
    }
  }

  // -------------------------------------------------------------
  // Filtered Appointments (Search + Status)
  // -------------------------------------------------------------
  const filteredAppointments = appointments.filter((apt) => {
    // Status filter
    if (appointmentStatusFilter !== 'ALL' && apt.status !== appointmentStatusFilter) {
      return false
    }

    // Search query (Patient name or Doctor name)
    const q = appointmentSearch.trim().toLowerCase()
    if (!q) return true

    const patientName = apt.patient?.name?.toLowerCase() || ''
    const doctorName = apt.doctor?.user?.name?.toLowerCase() || ''

    return patientName.includes(q) || doctorName.includes(q)
  })

  // Status Badge Helper
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

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, {user?.name || 'Administrator'}!
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            System administration, medical personnel management, patient records, and appointment monitoring.
          </p>
        </div>
      </div>

      {/* Global Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-700 hover:text-red-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. System Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Total Doctors
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 block">
            {stats.totalDoctors}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-sm">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
            Total Patients
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-teal-700 mt-1 block">
            {stats.totalPatients}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-sm">
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider block">
            Total Appointments
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-sky-700 mt-1 block">
            {stats.totalAppointments}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
            Pending Approval
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1 block">
            {stats.pendingAppointments}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`py-3 px-5 font-semibold text-sm rounded-t-lg transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'border-primary text-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Manage Doctors</span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-bold">
            {doctors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`py-3 px-5 font-semibold text-sm rounded-t-lg transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'patients'
              ? 'border-primary text-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>View Patients</span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-bold">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-5 font-semibold text-sm rounded-t-lg transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-primary text-primary bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>All Appointments</span>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-bold">
            {appointments.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANAGE DOCTORS */}
      {/* ========================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Clinic Doctors Directory</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Register new specialists, modify credentials, fees, and consultation schedules.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition shadow-sm whitespace-nowrap"
            >
              + Add New Doctor
            </button>
          </div>

          {loadingDoctors ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mb-3"></div>
              <p>Loading doctors...</p>
            </div>
          ) : doctorsError ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {doctorsError}
              <button
                onClick={fetchDoctors}
                className="block mt-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              No doctors registered yet. Click &quot;Add New Doctor&quot; to create one.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => {
                const docName = doc.user?.name || 'Dr. Medical Specialist'
                const isDeleting = deletingDoctorId === doc._id

                return (
                  <div
                    key={doc._id}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{docName}</h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-primary text-xs font-semibold rounded-full">
                            {doc.specialization}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ${doc.consultationFee}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-3">
                        <div>
                          <span className="text-gray-400">Email: </span>
                          <span className="font-medium text-gray-800">{doc.user?.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Phone: </span>
                          <span className="font-medium text-gray-800">
                            {doc.user?.phone || 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Qualification: </span>
                          <span className="font-medium text-gray-800">{doc.qualification}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Experience: </span>
                          <span className="font-medium text-gray-800">
                            {doc.experience} {doc.experience === 1 ? 'Year' : 'Years'}
                          </span>
                        </div>
                      </div>

                      {/* Configured Slots preview */}
                      <div className="border-t border-gray-100 pt-2 text-xs">
                        <span className="text-gray-400 block mb-1">Available Slots:</span>
                        {doc.availableSlots && doc.availableSlots.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {doc.availableSlots.map((slot) => (
                              <span
                                key={slot}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-2xs font-mono rounded"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No slots configured</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2 justify-end">
                      <button
                        onClick={() => handleOpenEditModal(doc)}
                        className="px-3.5 py-1.5 bg-secondary text-primary hover:bg-sky-200 text-xs font-semibold rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc)}
                        disabled={isDeleting}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          isDeleting
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-rose-600 border-rose-200 bg-rose-50/40 hover:bg-rose-100 hover:border-rose-300'
                        }`}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VIEW PATIENTS */}
      {/* ========================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Registered Patients</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Secure patient directory showing registered accounts. Passwords and credentials are never exposed.
            </p>
          </div>

          {loadingPatients ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mb-3"></div>
              <p>Loading patients...</p>
            </div>
          ) : patientsError ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {patientsError}
              <button
                onClick={fetchPatients}
                className="block mt-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              No registered patients found.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">Patient Name</th>
                      <th className="py-3.5 px-6 font-semibold">Email</th>
                      <th className="py-3.5 px-6 font-semibold">Phone</th>
                      <th className="py-3.5 px-6 font-semibold">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patients.map((pat) => (
                      <tr key={pat._id} className="hover:bg-gray-50/60 transition">
                        <td className="py-4 px-6 font-semibold text-gray-800">
                          {pat.name}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-700">
                          {pat.email}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {pat.phone || 'Not provided'}
                        </td>
                        <td className="py-4 px-6 text-gray-500 text-xs">
                          {pat.createdAt
                            ? formatDisplayDate(pat.createdAt.slice(0, 10))
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ALL APPOINTMENTS */}
      {/* ========================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">All System Appointments</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Live monitoring of all clinic appointments across doctors and patients.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                placeholder="Search patient or doctor..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((tab) => {
              const isActive = appointmentStatusFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setAppointmentStatusFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {loadingAppointments ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mb-3"></div>
              <p>Loading all appointments...</p>
            </div>
          ) : appointmentsError ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {appointmentsError}
              <button
                onClick={fetchAppointments}
                className="block mt-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
              No appointments matched your filter criteria.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">Patient</th>
                      <th className="py-3.5 px-6 font-semibold">Doctor</th>
                      <th className="py-3.5 px-6 font-semibold">Date & Time</th>
                      <th className="py-3.5 px-6 font-semibold">Reason</th>
                      <th className="py-3.5 px-6 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAppointments.map((apt) => {
                      const patientName = apt.patient?.name || 'Patient'
                      const doctorName = apt.doctor?.user?.name || 'Doctor'

                      return (
                        <tr key={apt._id} className="hover:bg-gray-50/60 transition">
                          <td className="py-4 px-6 font-semibold text-gray-800">
                            {patientName}
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-800">
                            {doctorName}
                          </td>
                          <td className="py-4 px-6 text-gray-700">
                            <span className="font-medium">{formatDisplayDate(apt.date)}</span>
                            <span className="block text-xs text-gray-400">
                              {formatDisplayTime(apt.time)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-600 max-w-xs truncate" title={apt.reason}>
                            {apt.reason}
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(apt.status)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD DOCTOR */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add New Doctor</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitAddDoctor} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="Dr. John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="doctor@clinic.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Password * (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="0771234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.specialization}
                    onChange={(e) =>
                      setAddForm({ ...addForm, specialization: e.target.value })
                    }
                    placeholder="Cardiology, Pediatrics..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.qualification}
                    onChange={(e) =>
                      setAddForm({ ...addForm, qualification: e.target.value })
                    }
                    placeholder="MBBS, MD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.experience}
                    onChange={(e) =>
                      setAddForm({ ...addForm, experience: e.target.value })
                    }
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Consultation Fee ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.consultationFee}
                    onChange={(e) =>
                      setAddForm({ ...addForm, consultationFee: e.target.value })
                    }
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Profile Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={addForm.profileImage}
                  onChange={(e) =>
                    setAddForm({ ...addForm, profileImage: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Available Slots Builder */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Configured Available Slots (HH:MM):
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="time"
                    value={newSlotAdd}
                    onChange={(e) => setNewSlotAdd(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlotToAddForm}
                    className="px-4 py-1.5 bg-secondary text-primary font-semibold text-xs rounded-lg hover:bg-sky-200"
                  >
                    + Add Slot
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {addForm.availableSlots.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-primary text-xs font-semibold rounded-lg"
                    >
                      <span>{slot}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlotFromAddForm(slot)}
                        className="text-teal-700 hover:text-red-600 font-bold ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="border-t pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className={`px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg transition ${
                    isSubmittingDoctor
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'hover:bg-teal-700 shadow-sm'
                  }`}
                >
                  {isSubmittingDoctor ? 'Creating...' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT DOCTOR */}
      {/* ========================================================= */}
      {isEditModalOpen && selectedDoctorForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Doctor Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {editForm._id}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitEditDoctor} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address (Immutable)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={editForm.email}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.specialization}
                    onChange={(e) =>
                      setEditForm({ ...editForm, specialization: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.qualification}
                    onChange={(e) =>
                      setEditForm({ ...editForm, qualification: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.experience}
                    onChange={(e) =>
                      setEditForm({ ...editForm, experience: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Consultation Fee ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.consultationFee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, consultationFee: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Profile Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.profileImage}
                    onChange={(e) =>
                      setEditForm({ ...editForm, profileImage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Available Slots Builder */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Configured Available Slots (HH:MM):
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="time"
                    value={newSlotEdit}
                    onChange={(e) => setNewSlotEdit(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlotToEditForm}
                    className="px-4 py-1.5 bg-secondary text-primary font-semibold text-xs rounded-lg hover:bg-sky-200"
                  >
                    + Add Slot
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {editForm.availableSlots.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-primary text-xs font-semibold rounded-lg"
                    >
                      <span>{slot}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlotFromEditForm(slot)}
                        className="text-teal-700 hover:text-red-600 font-bold ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="border-t pt-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className={`px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg transition ${
                    isSubmittingDoctor
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'hover:bg-teal-700 shadow-sm'
                  }`}
                >
                  {isSubmittingDoctor ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
