// Appointment controller - handles booking, cancellation, and status transitions
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Helper to format populate for doctor with its user info
const doctorPopulate = {
  path: 'doctor',
  populate: { path: 'user', select: 'name email phone -_id' },
  select: '-__v'
};

// Helper to populate patient user info
const patientPopulate = {
  path: 'patient',
  select: 'name email phone -_id'
};

// 1. Create Appointment (PATIENT only)
exports.createAppointment = async (req, res) => {
  try {
    const { doctor, date, time, reason } = req.body;
    // Basic validation
    if (!doctor || !date || !time || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate Doctor ID format
    if (!mongoose.Types.ObjectId.isValid(doctor)) {
      return res.status(400).json({ message: 'Invalid doctor ID format' });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ message: 'Invalid date value' });
    }

    // Validate date and time against Sri Lankan timezone (Asia/Colombo UTC+05:30)
    const now = new Date();
    const nowSriLanka = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const todaySL = nowSriLanka.toISOString().slice(0, 10);
    const nowTimeSL = nowSriLanka.toTimeString().slice(0, 5); // HH:MM

    // Ensure date is not in the past
    if (date < todaySL) {
      return res.status(400).json({ message: 'Appointment date cannot be in the past' });
    }
    // If booking for today, ensure time is in the future
    if (date === todaySL && time <= nowTimeSL) {
      return res.status(400).json({ message: 'Appointment time must be in the future' });
    }

    // Validate time format HH:MM (00-23:00-59)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ message: 'Invalid time format, expected HH:MM' });
    }

    // Verify doctor exists
    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Ensure requested time is within doctor's configured availableSlots
    if (!doctorDoc.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time is not available for this doctor' });
    }

    // Check for existing active appointment (PENDING or CONFIRMED) for same slot
    const existing = await Appointment.findOne({
      doctor,
      date,
      time,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });
    if (existing) {
      return res.status(409).json({ message: 'This appointment slot is already booked' });
    }

    // Create appointment – patient is derived from token
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      date,
      time,
      reason,
      status: 'PENDING'
    });
    const populated = await appointment.populate(doctorPopulate);
    return res.status(201).json({ appointment: populated });
  } catch (error) {
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This appointment slot is already booked' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get My Appointments (PATIENT)
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate(doctorPopulate)
      .select('-__v');
    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get Appointment By ID (PATIENT/DOCTOR/ADMIN)
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate(doctorPopulate)
      .populate(patientPopulate)
      .select('-__v');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const userRole = req.user.role;
    if (userRole === 'ADMIN') {
      return res.status(200).json(appointment);
    }
    if (userRole === 'PATIENT' && appointment.patient.toString() === req.user._id.toString()) {
      return res.status(200).json(appointment);
    }
    if (userRole === 'DOCTOR') {
      const doctorDoc = await Doctor.findOne({ user: req.user._id });
      if (doctorDoc && appointment.doctor._id.toString() === doctorDoc._id.toString()) {
        return res.status(200).json(appointment);
      }
    }
    return res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 4. Cancel Appointment (PATIENT only)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Completed appointments cannot be cancelled' });
    }
    if (appointment.status === 'CANCELLED') {
      return res.status(200).json({ message: 'Appointment already cancelled', appointment });
    }
    appointment.status = 'CANCELLED';
    await appointment.save();
    return res.status(200).json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 5. Delete cancelled appointment (PATIENT only)
exports.deleteCancelledAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Verify ownership
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Verify status
    if (appointment.status !== 'CANCELLED') {
      return res.status(400).json({ message: 'Only cancelled appointments can be deleted' });
    }
    await appointment.deleteOne();
    return res.status(200).json({ message: 'Cancelled appointment deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 6. Doctor's Appointments (DOCTOR only)
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorDoc = await Doctor.findOne({ user: req.user._id });
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const appointments = await Appointment.find({ doctor: doctorDoc._id })
      .populate(patientPopulate)
      .populate({ path: 'doctor', select: '-__v' })
      .select('-__v');
    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 7. Update Appointment Status (DOCTOR only)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['CONFIRMED', 'COMPLETED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of ${allowed.join(', ')}` });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const doctorDoc = await Doctor.findOne({ user: req.user._id });
    if (!doctorDoc || appointment.doctor.toString() !== doctorDoc._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Terminal states cannot be altered
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot update a cancelled appointment' });
    }
    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Completed appointments cannot be modified' });
    }
    // Normal workflow: PENDING -> CONFIRMED -> COMPLETED
    if (status === 'CONFIRMED' && appointment.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING appointments can be confirmed' });
    }
    if (status === 'COMPLETED' && appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Only CONFIRMED appointments can be completed' });
    }
    appointment.status = status;
    await appointment.save();
    return res.status(200).json({ message: 'Status updated', appointment });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid appointment ID format' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 8. Get All Appointments (ADMIN only)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate(doctorPopulate)
      .populate(patientPopulate)
      .select('-__v');
    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
