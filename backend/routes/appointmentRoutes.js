const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointments,
} = require('../controllers/appointmentController');

const router = express.Router();

// Fixed routes before :id
router.post('/', protect, authorizeRoles('PATIENT'), createAppointment);
router.get('/my', protect, authorizeRoles('PATIENT'), getMyAppointments);
router.get('/doctor', protect, authorizeRoles('DOCTOR'), getDoctorAppointments);
router.get('/all', protect, authorizeRoles('ADMIN'), getAllAppointments);

// Dynamic routes
router.get('/:id', protect, getAppointmentById);
router.put('/:id/cancel', protect, authorizeRoles('PATIENT'), cancelAppointment);
router.put('/:id/status', protect, authorizeRoles('DOCTOR'), updateAppointmentStatus);

module.exports = router;
