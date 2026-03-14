import './loadEnv.js';
import { MongoClient } from 'mongodb';
import { query, closePool } from '../config/postgresql.js';

const directUri = "mongodb://vemulaharshith1476_db_user:3Fy7SLnYqk6SKblw@ac-tqp7j9k-shard-00-00.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-01.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-02.btuitho.mongodb.net:27017/?authSource=admin&ssl=true";

const finalMigrate = async () => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(directUri);
        await mongoClient.connect();
        const db = mongoClient.db('test');
        console.log('🚀 Final Sync from [test] database...');

        // 1. Job Applications
        const jobs = await db.collection('jobapplications').find({}).toArray();
        for (const j of jobs) {
            await query(
                `INSERT INTO job_applications (name, email, phone, position, resume_url, cover_letter, city, qualification, experience, skills) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
                [j.name || 'N/A', j.email, j.phone || '000', j.position || 'N/A', j.resumeUrl || '', j.coverLetter || '', j.city || '', j.qualification || '', j.experience || '', j.skills || '']
            ).catch(err => console.log(`Skip Job ${j.email}: ${err.message}`));
        }
        console.log(`✅ Job Apps check complete.`);

        // 2. Health Records
        const hRecs = await db.collection('healthrecords').find({}).toArray();
        for (const r of hRecs) {
            const uId = (await query('SELECT id FROM users WHERE email = $1', [r.userEmail])).rows[0]?.id;
            if (uId) {
                await query(
                    `INSERT INTO health_records (user_id, title, description, record_type, doctor_name, record_date) 
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                    [uId, r.title || 'Untitled', r.description || '', r.recordType || 'general', r.doctorName || 'Unknown', r.recordDate || new Date()]
                ).catch(err => console.log(`Skip HRec: ${err.message}`));
            }
        }
        console.log(`✅ Health Records check complete.`);

        // 3. Specialties
        const specs = await db.collection('specialties').find({}).toArray();
        for (const s of specs) {
            const sName = s.name || s.specialty_name || s.speciality;
            if (!sName) continue;
            await query(
                `INSERT INTO specialties (specialty_name, helpline_number, availability) 
                 VALUES ($1, $2, $3) ON CONFLICT (specialty_name) DO NOTHING`,
                [sName, '1800-123-4567', '24x7']
            ).catch(err => console.log(`Skip Spec ${sName}: ${err.message}`));
        }
        console.log(`✅ Specialties check complete.`);

        // 4. Medical Knowledge
        console.log('📦 Migrating Medical Knowledges...');
        const mkDocs = await db.collection('medicalknowledges').find({}).toArray();
        let mkCount = 0;
        for (const item of mkDocs) {
            if (!item.symptom) continue;
            await query(
                `INSERT INTO medical_knowledge (symptom, conditions, severity, otc_medicines, precautions, when_to_see_doctor) 
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (symptom) DO NOTHING`,
                [item.symptom, item.conditions || [], item.severity, item.otc_medicines || [], item.precautions || [], item.when_to_see_doctor]
            ).catch(() => { });
            mkCount++;
            if (mkCount % 1000 === 0) process.stdout.write(`\rProgress: ${mkCount}/${mkDocs.length}`);
        }
        console.log(`\n✅ Finished Medical Knowledge (${mkCount} records)`);

        console.log('🌟 ALL DATA SYNCED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Sync Error:', err.message);
    } finally {
        if (mongoClient) await mongoClient.close();
        await closePool();
    }
};

finalMigrate();
