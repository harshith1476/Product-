const pool = require('../config/db');

const createHospital = async (req, res, next) => {
    try {
        const { name, location, contact_number } = req.body;

        if (!name || !location || !contact_number) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const result = await pool.query(
            'INSERT INTO hospitals (name, location, contact_number) VALUES ($1, $2, $3) RETURNING *',
            [name, location, contact_number]
        );

        res.status(201).json({
            success: true,
            message: 'Hospital created successfully',
            hospital: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getAllHospitals = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM hospitals ORDER BY created_at DESC');

        res.json({
            success: true,
            count: result.rows.length,
            hospitals: result.rows
        });
    } catch (error) {
        next(error);
    }
};

const getHospitalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM hospitals WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        res.json({
            success: true,
            hospital: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createHospital, getAllHospitals, getHospitalById };
