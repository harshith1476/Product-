const pool = require('../config/db');

const processPayment = async (req, res, next) => {
    try {
        const { appointment_id, amount, payment_method, transaction_id } = req.body;

        if (!appointment_id || !amount) {
            return res.status(400).json({ success: false, message: 'Appointment ID and amount are required' });
        }

        const appointmentExists = await pool.query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
        if (appointmentExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const result = await pool.query(
            'INSERT INTO payments (appointment_id, amount, payment_method, transaction_id, payment_status, payment_date) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [appointment_id, amount, payment_method, transaction_id, 'paid']
        );

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            payment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllPayments = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT pay.*, 
                   a.appointment_date,
                   p.name as patient_name,
                   d.name as doctor_name
            FROM payments pay
            JOIN appointments a ON pay.appointment_id = a.id
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            ORDER BY pay.created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            payments: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getPaymentByAppointment = async (req, res, next) => {
    try {
        const { appointment_id } = req.params;

        const result = await pool.query('SELECT * FROM payments WHERE appointment_id = $1', [appointment_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found for this appointment' });
        }

        res.json({
            success: true,
            payment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        if (!payment_status) {
            return res.status(400).json({ success: false, message: 'Payment status is required' });
        }

        const result = await pool.query(
            'UPDATE payments SET payment_status = $1 WHERE id = $2 RETURNING *',
            [payment_status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({
            success: true,
            message: 'Payment status updated',
            payment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { processPayment, getAllPayments, getPaymentByAppointment, updatePaymentStatus };
