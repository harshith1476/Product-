import { query } from './backend/config/postgresql.js';
import fs from 'fs';

async function checkIds() {
    try {
        const id = 2;
        const main = await query('SELECT id, name FROM doctors WHERE id = $1', [id]);
        const hosp = await query('SELECT id, name FROM hospital_tieup_doctors WHERE id = $1', [id]);
        
        const result = `Main Doctors table ID=2: ${JSON.stringify(main.rows)}\n` +
                       `Hospital Doctors table ID=2: ${JSON.stringify(hosp.rows)}\n`;
        fs.writeFileSync('ids_result.txt', result);
        console.log('Results written to ids_result.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkIds();
