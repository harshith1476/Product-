
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function testIpv6() {
    const ipv6 = '2406:da1c:93e:5200:bc9d:13df:1ebe:decc'; // db.hrtayvqddtpetpbskycl.supabase.co
    console.log(`Connecting to IPv6: ${ipv6} (Port 5432)...`);

    const client = new Client({
        host: ipv6,
        port: 5432,
        user: 'postgres',
        password: 'VHARSHITH121476$$',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false,
            servername: 'db.hrtayvqddtpetpbskycl.supabase.co'
        },
        connectionTimeoutMillis: 30000
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully to IPv6!');
        const res = await client.query('SELECT NOW()');
        console.log('Query Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Failed:', err.message);
        // if (err.stack) console.error(err.stack);
    }
}

testIpv6();
