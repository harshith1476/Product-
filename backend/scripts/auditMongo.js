import './loadEnv.js';
import { MongoClient } from 'mongodb';

const directUri = "mongodb://vemulaharshith1476_db_user:3Fy7SLnYqk6SKblw@ac-tqp7j9k-shard-00-00.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-01.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-02.btuitho.mongodb.net:27017/?authSource=admin&ssl=true";

const audit = async () => {
    let mongoClient;
    try {
        mongoClient = new MongoClient(directUri);
        await mongoClient.connect();
        const dbsRes = await mongoClient.db().admin().listDatabases();
        for (const dbInfo of dbsRes.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
            console.log(`\n--- DB: ${dbInfo.name} ---`);
            const db = mongoClient.db(dbInfo.name);
            const cols = await db.listCollections().toArray();
            for (const c of cols) {
                const count = await db.collection(c.name).countDocuments();
                console.log(`- ${c.name}: ${count}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (mongoClient) await mongoClient.close();
        process.exit();
    }
};
audit();
