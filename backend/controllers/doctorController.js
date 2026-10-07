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

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
