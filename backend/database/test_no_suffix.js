
import pg from 'pg';
const { Client } = pg;

async function testNoSuffix() {
    const client = new Client({
        host: "aws-0-ap-south-1.pooler.supabase.com",
        port: 5432,
        user: "postgres",
        password: "VHARSHITH121476$$",
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ SUCCESS no suffix!");
        await client.end();
    } catch (err) {
        console.log("❌ FAILED no suffix: " + err.message);
    }
}

testNoSuffix();
