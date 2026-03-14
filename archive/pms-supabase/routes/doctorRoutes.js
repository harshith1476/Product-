const express = require('express');
const { addDoctor, getAllDoctors, getDoctorById, getDoctorsByHospital } = require('../controllers/doctorController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleAuth('admin'), addDoctor);
router.get('/', authMiddleware, getAllDoctors);
router.get('/:id', authMiddleware, getDoctorById);
router.get('/hospital/:hospital_id', authMiddleware, getDoctorsByHospital);

module.exports = router;
