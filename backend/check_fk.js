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

async function check() {
    try {
        const res = await pool.query(`
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.key_column_usage AS kcu
            JOIN
                information_schema.constraint_column_usage AS ccu
                ON kcu.constraint_name = ccu.constraint_name
            WHERE
                kcu.table_name = 'appointments'
                AND kcu.column_name = 'doctor_id';
        `);
        console.log('Constraint Info:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
