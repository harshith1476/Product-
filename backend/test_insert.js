import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

async function testInsert() {
    try {
        console.log('Attempting to insert dummy appointment for doctor_id = 5...');
        const res = await pool.query(`
            INSERT INTO appointments (
                user_id, doctor_id, slot_date, slot_time, user_data, doctor_data,
                amount, consultation_fee, platform_fee, gst, cost_breakdown, date,
                payment_method, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `, [
            6, // The user ID we found
            5, // The doctor ID
            '10_3_2026',
            '10:30 AM',
            '{}',
            '{}',
            500,
            500,
            25,
            90,
            '{}',
            Date.now(),
            'payOnVisit',
            'pending'
        ]);
        console.log('✅ Success! Appointment ID:', res.rows[0].id);
    } catch (err) {
        console.error('❌ Failed to insert:');
        console.error(err.message);
        console.error('Detail:', err.detail);
        console.error('Constraint:', err.constraint);
    } finally {
        await pool.end();
    }
}

testInsert();
