const pool = require('../config/db');

const bookAppointment = async (req, res, next) => {
    try {
        const { patient_id, doctor_id, appointment_date, notes } = req.body;

        if (!patient_id || !doctor_id || !appointment_date) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const patientExists = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
        if (patientExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const doctorExists = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctor_id]);
        if (doctorExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const result = await pool.query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id, doctor_id, appointment_date, notes, 'pending']
        );

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllAppointments = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   p.name as patient_name, p.contact_number as patient_contact,
                   d.name as doctor_name, d.specialization,
                   h.name as hospital_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            ORDER BY a.appointment_date DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            appointments: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getDoctorAppointments = async (req, res, next) => {
    try {
        const { doctor_id } = req.params;

        const result = await pool.query(`
            SELECT a.*, 
                   p.name as patient_name, p.age, p.gender, p.contact_number as patient_contact
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = $1
            ORDER BY a.appointment_date DESC
        `, [doctor_id]);

        res.json({
            success: true,
            count: result.rows.length,
            appointments: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getPatientAppointments = async (req, res, next) => {
    try {
        const { patient_id } = req.params;

        const result = await pool.query(`
            SELECT a.*, 
                   d.name as doctor_name, d.specialization,
                   h.name as hospital_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC
        `, [patient_id]);

        res.json({
            success: true,
            count: result.rows.length,
            appointments: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const result = await pool.query(
            'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.json({
            success: true,
            message: 'Appointment status updated',
            appointment: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    bookAppointment,
    getAllAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointmentStatus
};
