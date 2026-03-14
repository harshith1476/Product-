import { query, pool } from './config/postgresql.js';

async function inspectSlots() {
    try {
        const docId = 11;
        console.log(`--- Inspecting Slots for Doctor ID: ${docId} ---`);
        const res = await query('SELECT id, name, slots_booked, available FROM doctors WHERE id = $1', [docId]);
        if (res.rows.length > 0) {
            const doctor = res.rows[0];
            console.log('Doctor:', doctor.name);
            console.log('Available:', doctor.available);
            console.log('Slots Booked:', JSON.stringify(doctor.slots_booked, null, 2));
            console.log('Type of Slots Booked:', typeof doctor.slots_booked);
        } else {
            console.log('Doctor not found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectSlots();
