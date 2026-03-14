import { query } from './backend/config/postgresql.js';

async function verifyDoctor() {
    try {
        const id = 2;
        const main = await query('SELECT name, slots_booked FROM doctors WHERE id = $1', [id]);
        const hosp = await query('SELECT name, slots_booked FROM hospital_tieup_doctors WHERE id = $1', [id]);
        
        console.log('--- DOCTOR ID: 2 ---');
        if (main.rows.length > 0) {
            console.log('Found in doctors table:');
            console.log('Name:', main.rows[0].name);
            console.log('Slots:', JSON.stringify(main.rows[0].slots_booked, null, 2));
        } else {
            console.log('Not found in doctors table.');
        }

        if (hosp.rows.length > 0) {
            console.log('Found in hospital_tieup_doctors table:');
            console.log('Name:', hosp.rows[0].name);
            console.log('Slots:', JSON.stringify(hosp.rows[0].slots_booked, null, 2));
        } else {
            console.log('Not found in hospital_tieup_doctors table.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyDoctor();
