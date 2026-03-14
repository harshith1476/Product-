import { MongoClient } from 'mongodb';
import fs from 'fs';

const uri = "mongodb://vemulaharshith1476_db_user:3Fy7SLnYqk6SKblw@ac-tqp7j9k-shard-00-00.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-01.btuitho.mongodb.net:27017,ac-tqp7j9k-shard-00-02.btuitho.mongodb.net:27017/?authSource=admin&ssl=true";

async function dumpMongo() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbsRes = await client.db().admin().listDatabases();
        let allData = {};

        for (const dbInfo of dbsRes.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            allData[dbInfo.name] = {};

            for (const colInfo of collections) {
                const colData = await db.collection(colInfo.name).find({}).toArray();
                allData[dbInfo.name][colInfo.name] = colData;
            }
        }

        fs.writeFileSync('mongo_dump.json', JSON.stringify(allData, null, 2));
        console.log('✅ MongoDB dump saved to mongo_dump.json');
    } catch (err) {
        console.error('❌ MongoDB dump failed:', err);
    } finally {
        await client.close();
    }
}

dumpMongo();
