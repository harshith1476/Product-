
import pg from 'pg';
const { Client } = pg;

const passwordWithBrackets = "[VHARSHITH121476$$]";
const user = "postgres.hrtayvqddtpetpbskycl";
const host = "aws-0-ap-south-1.pooler.supabase.com";

async function testBrackets() {
    const client = new Client({
        host: host,
        port: 5432,
        user: user,
        password: passwordWithBrackets,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ SUCCESS with brackets!");
        await client.end();
    } catch (err) {
        console.log("❌ FAILED with brackets: " + err.message);
    }
}

testBrackets();
