import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new pg.Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'healthsystem_pg',
    password: process.env.PG_PASSWORD || 'Javali786',
    port: parseInt(process.env.PG_PORT) || 5432,
    ssl: false
});

async function clearAppointmentsAndUsers() {
  try {
    const tablesToClear = [
        'appointments',
        'health_records',
        'consultations',
        'lab_bookings',
        'job_applications',
        'users'
    ];

    for (const table of tablesToClear) {
         try {
             await pool.query(`DELETE FROM ${table}`);
             console.log(`Cleared all rows from ${table}.`);
         } catch (e) {
             console.log(`Could not clear ${table}: ${e.message}`);
         }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

clearAppointmentsAndUsers();
