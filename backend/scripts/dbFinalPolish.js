import './loadEnv.js';
import { query, closePool } from '../config/postgresql.js';

const polish = async () => {
    try {
        console.log('✨ Starting Database Final Polish...');

        // 1. Fix all Sequences (Crucial for future inserts)
        const tables = [
            'users', 'doctors', 'hospitals', 'admins', 'specialties',
            'hospital_tieups', 'hospital_tieup_doctors', 'appointments',
            'health_records', 'consultations', 'job_applications',
            'conversations', 'notifications', 'medical_knowledge',
            'queue_settings', 'emergency_contacts', 'saved_profiles'
        ];

        for (const table of tables) {
            const seqName = `${table}_id_seq`;
            await query(`SELECT setval($1, COALESCE((SELECT MAX(id) FROM ${table}), 1))`, [seqName]);
        }
        console.log('✅ All ID sequences synchronized.');

        // 2. Seed Hospital Tie-up Doctors (demo data linked to real hospitals)
        const tieups = (await query('SELECT id FROM hospital_tieups LIMIT 51')).rows;
        if (tieups.length > 0) {
            const docNames = ['Dr. Arun Kumar', 'Dr. Priya Sharma', 'Dr. John Doe', 'Dr. Maria Garcia'];
            for (const t of tieups) {
                const count = (await query('SELECT count(*) FROM hospital_tieup_doctors WHERE hospital_tieup_id = $1', [t.id])).rows[0].count;
                if (parseInt(count) === 0) {
                    const name = docNames[Math.floor(Math.random() * docNames.length)];
                    await query(
                        `INSERT INTO hospital_tieup_doctors (hospital_tieup_id, name, qualification, specialization, experience) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [t.id, name, 'MBBS, MD', 'General Medicine', '10+ Years']
                    );
                }
            }
            console.log('✅ Seeded doctors for collaborated hospitals.');
        }

        // 3. Seed Queue Settings for all 22 Doctors
        const doctors = (await query('SELECT id FROM doctors')).rows;
        for (const doc of doctors) {
            await query(
                `INSERT INTO queue_settings (doctor_id, average_consultation_time, max_queue_size, is_active) 
                 VALUES ($1, $2, $3, $4) ON CONFLICT (doctor_id) DO NOTHING`,
                [doc.id, 15, 20, true]
            );
        }
        console.log('✅ Seeded default queue settings for all 22 doctors.');

        // 4. Seed a few Notifications
        const users = (await query('SELECT id FROM users LIMIT 5')).rows;
        for (const u of users) {
            await query(
                `INSERT INTO notifications (user_id, title, message, type) 
                 VALUES ($1, $2, $3, $4)`,
                [u.id, 'Welcome Back!', 'Your profile has been successfully migrated to PostgreSQL.', 'system']
            );
        }
        console.log('✅ Seeded welcome notifications for active users.');

        // 5. Final Count Report
        console.log('\n📊 FINAL DATABASE AUDIT:');
        for (const table of tables) {
            const count = (await query(`SELECT count(*) FROM ${table}`)).rows[0].count;
            console.log(`- ${table.padEnd(25)}: ${count}`);
        }

    } catch (err) {
        console.error('❌ Polish Error:', err.message);
    } finally {
        await closePool();
        process.exit();
    }
};

polish();
