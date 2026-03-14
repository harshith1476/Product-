import { query } from './backend/config/postgresql.js';
import fs from 'fs';

async function checkDrSmith() {
    try {
        const drSmith = await query("SELECT id, name FROM doctors WHERE name LIKE '%Smith%'");
        const allHospDocs = await query("SELECT id, name FROM hospital_tieup_doctors");
        const result = `Dr. Smith in doctors: ${JSON.stringify(drSmith.rows)}\nAll Hosp Docs: ${JSON.stringify(allHospDocs.rows)}\n`;
        fs.writeFileSync('smith.txt', result);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDrSmith();
