import { query } from './backend/config/postgresql.js';

async function dropConstraints() {
    try {
        console.log('Dropping foreign key doctors_hospital_id_fkey from doctors table...');
        await query('ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_hospital_id_fkey');
        
        console.log('Dropping foreign key appointments_doctor_id_fkey from appointments table...');
        await query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey');

        console.log('Constraints dropped successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error dropping constraints:', err);
        process.exit(1);
    }
}

dropConstraints();
