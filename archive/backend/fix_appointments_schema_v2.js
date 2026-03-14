import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'healthsystem_pg',
    password: 'Javali786',
    port: 5432,
});

async function migrate() {
    try {
        console.log('--- Starting Migration for Appointments Table ---');
        
        const queries = [
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS date BIGINT DEFAULT 0",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_symptoms TEXT[]",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_name VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_age VARCHAR(10)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_gender VARCHAR(50)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_relationship VARCHAR(100)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_medical_history TEXT[]",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_symptoms TEXT",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_phone VARCHAR(20)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_patient_is_self BOOLEAN DEFAULT true",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'In-person'",
            "ALTER TABLE appointments ALTER COLUMN date DROP DEFAULT",
            "ALTER TABLE appointments ALTER COLUMN date SET NOT NULL"
        ];

        for (const q of queries) {
            console.log(`Executing: ${q}`);
            await pool.query(q);
        }

        console.log('✅ Migration completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
