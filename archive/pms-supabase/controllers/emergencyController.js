const pool = require('../config/db');

const createEmergencyRequest = async (req, res, next) => {
    try {
        const { patient_id, hospital_id, emergency_type, description } = req.body;

        if (!patient_id || !hospital_id) {
            return res.status(400).json({ success: false, message: 'Patient ID and Hospital ID are required' });
        }

        const patientExists = await pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
        if (patientExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const hospitalExists = await pool.query('SELECT * FROM hospitals WHERE id = $1', [hospital_id]);
        if (hospitalExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        const result = await pool.query(
            'INSERT INTO emergency_requests (patient_id, hospital_id, emergency_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id, hospital_id, emergency_type, description, 'pending']
        );

        res.status(201).json({
            success: true,
            message: 'Emergency request created successfully',
            emergency: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllEmergencies = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT e.*, 
                   p.name as patient_name, p.contact_number as patient_contact,
                   h.name as hospital_name, h.contact_number as hospital_contact
            FROM emergency_requests e
            JOIN patients p ON e.patient_id = p.id
            JOIN hospitals h ON e.hospital_id = h.id
            ORDER BY e.created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            emergencies: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const updateEmergencyStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const result = await pool.query(
            'UPDATE emergency_requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Emergency request not found' });
        }

        res.json({
            success: true,
            message: 'Emergency status updated',
            emergency: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createEmergencyRequest, getAllEmergencies, updateEmergencyStatus };
