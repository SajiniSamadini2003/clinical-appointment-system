const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  updateMyAvailability,
  getAvailableSlots
} = require('../controllers/doctorController');

// Doctor self routes (must be before generic :id routes)
router.put('/me/availability', protect, authorizeRoles('DOCTOR'), updateMyAvailability);

// Public route for a doctor's available slots on a date
router.get('/:id/available-slots', getAvailableSlots);

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Admin only routes
router.post('/', protect, authorizeRoles('ADMIN'), createDoctor);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateDoctor);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteDoctor);

module.exports = router;

