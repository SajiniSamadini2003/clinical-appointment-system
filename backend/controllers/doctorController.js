const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Create a new doctor (ADMIN only)
const createDoctor = async (req, res) => {
  let createdUserId = null;
  
  try {
    const {
      name, email, password, phone,
      specialization, qualification, experience, consultationFee,
      availableSlots, profileImage
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !specialization || !qualification || experience === undefined || consultationFee === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create User with DOCTOR role
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'DOCTOR'
    });

    await user.save();
    createdUserId = user._id; // Store ID for potential rollback

    // Create Doctor document
    const doctor = new Doctor({
      user: user._id,
      specialization,
      qualification,
      experience,
      consultationFee,
      availableSlots: availableSlots || [],
      profileImage: profileImage || ""
    });

    await doctor.save();

    // Return the created doctor without password
    const createdDoctor = await Doctor.findById(doctor._id).populate('user', 'name email phone role');

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: createdDoctor
    });

  } catch (error) {
    // Basic rollback: If user was created but doctor creation failed, remove the user
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }
    res.status(500).json({ message: 'Server error creating doctor', error: error.message });
  }
};

// Get all doctors (PUBLIC)
const getDoctors = async (req, res) => {
  try {
    // Populate user details, explicitly excluding password
    const doctors = await Doctor.find().populate('user', 'name email phone');
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
};

// Get doctor by ID (PUBLIC)
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email phone');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching doctor' });
  }
};

// Update doctor (ADMIN only for Phase 8)
const updateDoctor = async (req, res) => {
  try {
    const {
      name, phone, // User fields
      specialization, qualification, experience, consultationFee, availableSlots, profileImage // Doctor fields
    } = req.body;

    const doctor = await Doctor.findById(req.params.id).populate('user');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Update Doctor specific fields
    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (availableSlots) doctor.availableSlots = availableSlots;
    if (profileImage) doctor.profileImage = profileImage;

    await doctor.save();

    // Update basic User fields
    const user = await User.findById(doctor.user._id);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    // Return updated doctor
    const updatedDoctor = await Doctor.findById(req.params.id).populate('user', 'name email phone role');
    
    res.status(200).json({
      message: 'Doctor updated successfully',
      doctor: updatedDoctor
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error updating doctor' });
  }
};

// Delete doctor (ADMIN only)
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete the linked User document
    await User.findByIdAndDelete(doctor.user);

    // Delete the Doctor document
    await Doctor.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting doctor' });
  }
};

const Appointment = require('../models/Appointment');

// Update own availability (DOCTOR only)
const updateMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const { availableSlots } = req.body;
    if (!Array.isArray(availableSlots)) {
      return res.status(400).json({ message: 'availableSlots must be an array' });
    }
    // Validate HH:MM format
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const slot of availableSlots) {
      if (!timeRegex.test(slot)) {
        return res.status(400).json({ message: `Invalid time format: ${slot}` });
      }
    }
    // Remove duplicates and sort
    const uniqueSlots = Array.from(new Set(availableSlots)).sort();
    doctor.availableSlots = uniqueSlots;
    await doctor.save();
    res.status(200).json({ message: 'Availability updated', availableSlots: doctor.availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
};

// Public endpoint: get available slots for a specific date
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date query parameter is required' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // Doctor's configured slots
    const configuredSlots = doctor.availableSlots || [];
    // Find booked slots for the date with active statuses
    const booked = await Appointment.find({
      doctor: doctor._id,
      date,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).select('time');
    const bookedTimes = booked.map(a => a.time);
    const availableSlots = configuredSlots.filter(slot => !bookedTimes.includes(slot));
    res.status(200).json({ doctor: doctor._id, date, availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching available slots' });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  updateMyAvailability,
  getAvailableSlots
};
