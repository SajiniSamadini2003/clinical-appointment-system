const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getPatients } = require('../controllers/adminController');

// Admin only routes
router.get('/patients', protect, authorizeRoles('ADMIN'), getPatients);

module.exports = router;
