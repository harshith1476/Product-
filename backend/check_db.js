import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    port: parseInt(process.env.PG_PORT) || 5432,
});

async function checkDoctor() {
    try {
        const res = await pool.query('SELECT * FROM doctors WHERE id = 5');
        console.log('Doctor ID 5:', res.rows[0]);
        const allDocs = await pool.query('SELECT id, name FROM doctors');
        console.log('All Doctors:', allDocs.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkDoctor();
