import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

async function getConstraints() {
    try {
        const res = await pool.query(`
            SELECT 
                conname AS constraint_name, 
                pg_get_constraintdef(c.oid) AS constraint_definition
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE n.nspname = 'public' 
            AND conrelid = 'appointments'::regclass;
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getConstraints();
