const express = require('express');
const {
    bookAppointment,
    getAllAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointmentStatus
} = require('../controllers/appointmentController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, bookAppointment);
router.get('/', authMiddleware, roleAuth('admin', 'doctor'), getAllAppointments);
router.get('/doctor/:doctor_id', authMiddleware, getDoctorAppointments);
router.get('/patient/:patient_id', authMiddleware, getPatientAppointments);
router.patch('/:id/status', authMiddleware, roleAuth('admin', 'doctor'), updateAppointmentStatus);

module.exports = router;
