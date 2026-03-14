const pool = require('../config/db');

const addPatient = async (req, res, next) => {
    try {
        const { name, age, gender, contact_number, email, address } = req.body;

        if (!name || !age || !gender || !contact_number) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const result = await pool.query(
            'INSERT INTO patients (name, age, gender, contact_number, email, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, age, gender, contact_number, email, address]
        );

        res.status(201).json({
            success: true,
            message: 'Patient added successfully',
            patient: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllPatients = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');

        res.json({
            success: true,
            count: result.rows.length,
            patients: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getPatientById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.json({
            success: true,
            patient: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { addPatient, getAllPatients, getPatientById };
