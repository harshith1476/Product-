import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'db.cdlycuzukfjipioepuso.supabase.co',
    database: 'postgres',
    password: 'yKh#6bJSvVB!+Ki',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('--- Doctors (Supabase) ---');
        const doctors = await pool.query('SELECT name, speciality, email FROM doctors LIMIT 5');
        console.table(doctors.rows);

        console.log('\n--- Patients (Supabase) ---');
        const users = await pool.query('SELECT name, email FROM users LIMIT 10');
        console.table(users.rows);

        console.log('\n--- Recent Appointments (Supabase) ---');
        const appointments = await pool.query('SELECT id, "slotDate", status FROM appointments ORDER BY id DESC LIMIT 5');
        console.table(appointments.rows);

    } catch (err) {
        console.error('Error during Supabase inspection:', err.message);
    } finally {
        await pool.end();
    }
}

inspect();
