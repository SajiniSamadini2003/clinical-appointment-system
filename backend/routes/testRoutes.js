const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// GET /profile - accessible to any authenticated user
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'Profile accessed successfully',
    user: req.user
  });
});

// GET /patient - accessible only to PATIENT role
router.get('/patient', protect, authorizeRoles('PATIENT'), (req, res) => {
  res.json({ message: 'Patient route accessed successfully' });
});

// GET /doctor - accessible only to DOCTOR role
router.get('/doctor', protect, authorizeRoles('DOCTOR'), (req, res) => {
  res.json({ message: 'Doctor route accessed successfully' });
});

// GET /admin - accessible only to ADMIN role
router.get('/admin', protect, authorizeRoles('ADMIN'), (req, res) => {
  res.json({ message: 'Admin route accessed successfully' });
});

module.exports = router;
