const express = require('express');
const { addPatient, getAllPatients, getPatientById } = require('../controllers/patientController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleAuth('admin', 'doctor'), addPatient);
router.get('/', authMiddleware, getAllPatients);
router.get('/:id', authMiddleware, getPatientById);

module.exports = router;
