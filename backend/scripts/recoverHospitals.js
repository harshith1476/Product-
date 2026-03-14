import './loadEnv.js';
import { MongoClient } from 'mongodb';
import { query, closePool } from '../config/postgresql.js';

const directUri = "mongodb://vemulaharshith1476_db_user:3Fy7SLnYqk6SKblw@ac-tqp7j9k-shard-00-00.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-01.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-02.btuitho.mongodb.net:27017/?authSource=admin&ssl=true";

const recoverHospitals = async () => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(directUri);
        await mongoClient.connect();

        const dbsRes = await mongoClient.db().admin().listDatabases();
        console.log('Searching for Hospitals...');

        for (const dbInfo of dbsRes.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
            const db = mongoClient.db(dbInfo.name);

            // Check 'hospitals' and 'hospitaltieups' (common variations)
            const hCount = await db.collection('hospitals').countDocuments().catch(() => 0);
            const tCount = await db.collection('hospitaltieups').countDocuments().catch(() => 0);

            if (hCount > 0 || tCount > 0) {
                console.log(`🎯 Found data in [${dbInfo.name}]: Hospitals=${hCount}, Tieups=${tCount}`);

                if (hCount > 0) {
                    const hData = await db.collection('hospitals').find({}).toArray();
                    for (const h of hData) {
                        await query(
                            `INSERT INTO hospitals (name, email, password, image, address_line1, address_line2, speciality, about, available) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (email) DO NOTHING`,
                            [h.name, h.email, h.password || 'migrated_hos', h.image, h.address?.line1 || '', h.address?.line2 || '', h.speciality || [], h.about || '', h.available !== false]
                        );
                    }
                    console.log(`✅ Migrated ${hData.length} Hospitals from ${dbInfo.name}`);
                }

                if (tCount > 0) {
                    const tData = await db.collection('hospitaltieups').find({}).toArray();
                    for (const t of tData) {
                        await query(
                            `INSERT INTO hospital_tieups (name, address, contact, specialization, type, show_on_home) 
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [t.name, t.address || t.location || '', t.contact || t.phone || '', t.specialization || t.speciality || '', t.type || 'General', true]
                        );
                    }
                    console.log(`✅ Migrated ${tData.length} Hospital Tie-ups from ${dbInfo.name}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Hospital Recovery Error:', error.message);
    } finally {
        if (mongoClient) await mongoClient.close();
        await closePool();
    }
};

recoverHospitals();
