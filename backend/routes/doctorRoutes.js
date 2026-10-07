const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Admin only routes
router.post('/', protect, authorizeRoles('ADMIN'), createDoctor);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateDoctor);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteDoctor);

module.exports = router;
