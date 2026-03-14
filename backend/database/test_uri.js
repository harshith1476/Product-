
import pg from 'pg';
const { Client } = pg;

const uri = "postgresql://postgres.hrtayvqddtpetpbskycl:VHARSHITH121476$$@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

async function testUri() {
    const client = new Client({
        connectionString: uri,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ SUCCESS with URI");
        await client.end();
    } catch (err) {
        console.log("❌ FAILED with URI: " + err.message);
    }
}

testUri();
