const express = require('express');
const { createHospital, getAllHospitals, getHospitalById } = require('../controllers/hospitalController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, roleAuth('admin'), createHospital);
router.get('/', authMiddleware, getAllHospitals);
router.get('/:id', authMiddleware, getHospitalById);

module.exports = router;
