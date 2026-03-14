import './loadEnv.js';
import { MongoClient } from 'mongodb';
import { query, closePool } from '../config/postgresql.js';

const directUri = "mongodb://vemulaharshith1476_db_user:3Fy7SLnYqk6SKblw@ac-tqp7j9k-shard-00-00.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-01.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-02.btuitho.mongodb.net:27017/?authSource=admin&ssl=true";

const recoverMedicalKnowledge = async () => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(directUri);
        await mongoClient.connect();

        const db = mongoClient.db('test'); // We know 'test' has the data now
        const mkCount = await db.collection('medicalknowledges').countDocuments().catch(() => 0);

        if (mkCount > 0) {
            console.log(`🎯 Found ${mkCount} Medical Knowledge records in [test]`);
            const mkData = await db.collection('medicalknowledges').find({}).toArray();
            let count = 0;
            for (const k of mkData) {
                await query(
                    `INSERT INTO medical_knowledge (symptom, conditions, severity, otc_medicines, precautions, when_to_see_doctor) 
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (symptom) DO NOTHING`,
                    [k.symptom, k.conditions || [], k.severity, k.otc_medicines || [], k.precautions || [], k.when_to_see_doctor]
                );
                count++;
            }
            console.log(`✅ Recovered ${count} Medical Knowledge records.`);
        } else {
            console.log('❌ No medical knowledge found in [test]. Checking other dbs...');
            // Optional: loop through all dbs if needed, but 'test' was the goldmine.
        }

    } catch (error) {
        console.error('❌ Recovery Error:', error.message);
    } finally {
        if (mongoClient) await mongoClient.close();
        await closePool();
    }
};

recoverMedicalKnowledge();
