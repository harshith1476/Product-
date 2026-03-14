const express = require('express');
const { createEmergencyRequest, getAllEmergencies, updateEmergencyStatus } = require('../controllers/emergencyController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createEmergencyRequest);
router.get('/', authMiddleware, roleAuth('admin', 'doctor'), getAllEmergencies);
router.patch('/:id/status', authMiddleware, roleAuth('admin'), updateEmergencyStatus);

module.exports = router;
