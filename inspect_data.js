import { query, closePool } from './backend/config/postgresql.js';

async function inspect() {
    try {
        console.log('--- Doctors ---');
        const doctors = await query('SELECT id, name, speciality, email FROM doctors LIMIT 5');
        console.table(doctors.rows);

        console.log('\n--- Users/Patients ---');
        const users = await query('SELECT id, name, email FROM users LIMIT 10');
        console.table(users.rows);

        console.log('\n--- Appointments ---');
        const appointments = await query('SELECT id, "patientId", "docId", "slotDate", "slotTime", status FROM appointments ORDER BY id DESC LIMIT 5');
        console.table(appointments.rows);

    } catch (err) {
        console.error('Error during inspection:', err);
    } finally {
        await closePool();
    }
}

inspect();
