import { query } from './backend/config/postgresql.js';
import fs from 'fs';

async function checkFK() {
    try {
        const res = await query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='appointments';
        `);
        let output = 'Foreign Keys for appointments:\n';
        res.rows.forEach(r => {
            output += `${r.column_name} -> ${r.foreign_table_name}(${r.foreign_column_name})\n`;
        });
        fs.writeFileSync('fk_result.txt', output);
        console.log('Results written to fk_result.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFK();
