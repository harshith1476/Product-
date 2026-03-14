import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:yKh#6bJSvVB!+Ki@db.cdlycuzukfjipioepuso.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('--- Doctors (Supabase) ---');
        const doctors = await pool.query('SELECT id, name, speciality, email FROM doctors LIMIT 5');
        console.table(doctors.rows);

        console.log('\n--- Users/Patients (Supabase) ---');
        const users = await pool.query('SELECT id, name, email FROM users LIMIT 10');
        console.table(users.rows);

        console.log('\n--- Appointments (Supabase) ---');
        const appointments = await pool.query('SELECT id, "patientId", "docId", "slotDate", status FROM appointments ORDER BY id DESC LIMIT 5');
        console.table(appointments.rows);

    } catch (err) {
        console.error('Error during Supabase inspection:', err.message);
    } finally {
        await pool.end();
    }
}

inspect();
