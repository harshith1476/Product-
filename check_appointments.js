import { query, closePool } from './backend/config/postgresql.js';

async function checkAppointments() {
    try {
        console.log('--- Checking Appointments Table ---');
        const countResult = await query('SELECT COUNT(*) FROM appointments');
        console.log('Total Appointments:', countResult.rows[0].count);

        if (parseInt(countResult.rows[0].count) > 0) {
            console.log('\n--- Recent Appointments ---');
            const recentApts = await query('SELECT id, user_id, doctor_id, slot_date, slot_time, status FROM appointments ORDER BY created_at DESC LIMIT 5');
            console.table(recentApts.rows);

            console.log('\n--- Checking Users Table ---');
            const userCount = await query('SELECT COUNT(*) FROM users');
            console.log('Total Users:', userCount.rows[0].count);

            const users = await query('SELECT id, name, email FROM users LIMIT 5');
            console.table(users.rows);
        } else {
            console.log('No appointments found in the database.');
        }

    } catch (error) {
        console.error('Database Error:', error.message);
    } finally {
        await closePool();
    }
}

checkAppointments();
