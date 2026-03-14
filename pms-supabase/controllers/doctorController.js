const pool = require('../config/db');

const addDoctor = async (req, res, next) => {
    try {
        const { name, specialization, hospital_id, email, contact_number } = req.body;

        if (!name || !specialization || !hospital_id || !email) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const hospitalExists = await pool.query('SELECT * FROM hospitals WHERE id = $1', [hospital_id]);
        if (hospitalExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        const result = await pool.query(
            'INSERT INTO doctors (name, specialization, hospital_id, email, contact_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, specialization, hospital_id, email, contact_number]
        );

        res.status(201).json({
            success: true,
            message: 'Doctor added successfully',
            doctor: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllDoctors = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT d.*, h.name as hospital_name 
            FROM doctors d 
            LEFT JOIN hospitals h ON d.hospital_id = h.id 
            ORDER BY d.created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            doctors: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getDoctorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT d.*, h.name as hospital_name 
            FROM doctors d 
            LEFT JOIN hospitals h ON d.hospital_id = h.id 
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.json({
            success: true,
            doctor: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getDoctorsByHospital = async (req, res, next) => {
    try {
        const { hospital_id } = req.params;
        const result = await pool.query('SELECT * FROM doctors WHERE hospital_id = $1', [hospital_id]);

        res.json({
            success: true,
            count: result.rows.length,
            doctors: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { addDoctor, getAllDoctors, getDoctorById, getDoctorsByHospital };
