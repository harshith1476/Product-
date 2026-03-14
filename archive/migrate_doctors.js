import { query } from './backend/config/postgresql.js';
import fs from 'fs';

async function migrateDoctors() {
    try {
        let log = 'Fetching all hospital_tieup_doctors...\n';
        const hospDocs = await query('SELECT * FROM hospital_tieup_doctors'); // This will get all doctors embedded
        const mainDocs = await query('SELECT * FROM doctors');
        
        for (const hDoc of hospDocs.rows) {
            // Check if a doctor with this name already exists in main doctors
            const exists = mainDocs.rows.find(d => d.name.toLowerCase() === hDoc.name.toLowerCase());
            if (!exists && !hDoc.name.includes('Sample Doctor')) {
                log += `Migrating ${hDoc.name} to doctors table...\n`;
                // Insert into doctors table
                const email = `${hDoc.name.toLowerCase().replace(/\s+/g, '.')}@hospital_${hDoc.hospital_tieup_id}.pms.local`;
                const password = "migrated_password_123";
                
                const values = [
                    hDoc.name, email, password, hDoc.image || '',
                    hDoc.specialization, hDoc.qualification, String(hDoc.experience || 0),
                    `Doctor at hospital ${hDoc.hospital_tieup_id}`, hDoc.available, 500,
                    '', '', Date.now(),
                    hDoc.slots_booked || {}, hDoc.hospital_tieup_id, false
                ];
                
                const sql = `
                    INSERT INTO doctors (
                        name, email, password, image, speciality, degree, experience,
                        about, available, fees, address_line1, address_line2, date, slots_booked, hospital_id, video_consult
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    RETURNING id
                `;
                
                try {
                    const res = await query(sql, values);
                    log += `Inserted ${hDoc.name} with new ID: ${res.rows[0].id}\n`;
                } catch (e) {
                    log += `Error inserting ${hDoc.name}: ${e.message}\n`;
                }
            } else if (exists) {
                log += `${hDoc.name} already exists in doctors as ID: ${exists.id}\n`;
            }
        }
        
        log += 'Migration complete.\n';
        fs.writeFileSync('migrate_result.txt', log);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateDoctors();
