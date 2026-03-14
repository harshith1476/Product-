import { query } from './backend/config/postgresql.js';

async function checkSchema() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hospital_tieup_doctors'
        `);
        console.log('Columns:', JSON.stringify(res.rows, null, 2));

        const mainDoc = await query('SELECT id, name, slots_booked FROM doctors WHERE id = 2');
        console.log('Main Doctor 2:', JSON.stringify(mainDoc.rows, null, 2));

        const hospDoc = await query('SELECT id, name, slots_booked FROM hospital_tieup_doctors WHERE id = 2');
        console.log('Hospital Doctor 2:', JSON.stringify(hospDoc.rows, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSchema();
