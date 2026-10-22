const User = require('../models/User');

// Get all registered patients (ADMIN only)
const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'PATIENT' })
      .select('_id name email phone createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
};

module.exports = {
  getPatients
};
