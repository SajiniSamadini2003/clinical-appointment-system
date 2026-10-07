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
    // Verify doctor exists
    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor not found' });
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
    const populated = await appointment.populate(doctorPopulate).execPopulate();
    res.status(201).json({ appointment: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get My Appointments (PATIENT)
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate(doctorPopulate)
      .select('-__v');
    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
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
    res.status(200).json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Doctor's Appointments (DOCTOR only)
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
    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Update Appointment Status (DOCTOR only)
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
    appointment.status = status;
    await appointment.save();
    res.status(200).json({ message: 'Status updated', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Get All Appointments (ADMIN only)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate(doctorPopulate)
      .populate(patientPopulate)
      .select('-__v');
    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
