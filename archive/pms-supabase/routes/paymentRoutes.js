const express = require('express');
const { processPayment, getAllPayments, getPaymentByAppointment, updatePaymentStatus } = require('../controllers/paymentController');
const { authMiddleware, roleAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, processPayment);
router.get('/', authMiddleware, roleAuth('admin'), getAllPayments);
router.get('/appointment/:appointment_id', authMiddleware, getPaymentByAppointment);
router.patch('/:id/status', authMiddleware, roleAuth('admin'), updatePaymentStatus);

module.exports = router;
