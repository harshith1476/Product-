import './loadEnv.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from '../config/postgresql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DATABASE INITIALIZER
 * Workflow:
 * 1. Load schema from database/complete-schema.sql
 * 2. If --reset is passed, it should wipe tables (handled in SQL if uncommented or manually)
 * 3. Execute the schema
 * 4. Verify core tables
 */

const initDB = async () => {
    try {
        const schemaPath = path.join(__dirname, '../database/complete-schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Check for --reset flag
        if (process.argv.includes('--reset')) {
            console.log('⚠️  RESET FLAG DETECTED: Wiping existing tables...');
            // We can programmatically uncomment the drop section or just manually do it here
            const resetSql = `
                DROP TABLE IF EXISTS job_applications, conversations, notifications, 
                queue_settings, medical_knowledge, consultations, health_records, 
                appointments, hospital_tieup_doctors, hospital_tieups, specialties, 
                hospitals, doctors, saved_profiles, emergency_contacts, users, admins CASCADE;
            `;
            await query(resetSql);
        }

        console.log('🚀 Executing master schema...');
        await query(schema);

        // Verification query
        const tables = await query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(`✅ System Aligned: ${tables.rows[0].count} tables established.`);

    } catch (error) {
        console.error('❌ Database Initialization Failed:', error.message);
    } finally {
        await closePool();
    }
};

initDB();
