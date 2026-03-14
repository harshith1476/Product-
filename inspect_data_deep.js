import { query, closePool } from './backend/config/postgresql.js';

async function inspectData() {
    try {
        console.log('--- Database Inspection ---');

        const tables = ['users', 'doctors', 'appointments', 'health_records'];
        for (const table of tables) {
            const result = await query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`Table: ${table}, Count: ${result.rows[0].count}`);
        }

        console.log('\n--- Recent Users ---');
        const users = await query('SELECT id, name, email FROM users ORDER BY created_at DESC LIMIT 5');
        console.table(users.rows);

        console.log('\n--- Recent Appointments ---');
        const appointments = await query(`
            SELECT id, user_id, doctor_id, slot_date, slot_time, status, cancelled, payment 
            FROM appointments 
            ORDER BY created_at DESC LIMIT 5
        `);
        console.table(appointments.rows);

        if (appointments.rows.length > 0) {
            const firstApt = appointments.rows[0];
            console.log('\n--- Checking User for First Appointment ---');
            const user = await query('SELECT id, name, email FROM users WHERE id = $1', [firstApt.user_id]);
            if (user.rows.length > 0) {
                console.log(`Appointment ${firstApt.id} belongs to user: ${user.rows[0].name} (${user.rows[0].email})`);
            } else {
                console.log(`User ID ${firstApt.user_id} not found for appointment ${firstApt.id}!`);
            }
        }

    } catch (error) {
        console.error('Database Error:', error.message);
    } finally {
        await closePool();
    }
}

inspectData();
