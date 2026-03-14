
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function testIp() {
    const ip = '3.108.251.216'; // Resolved from aws-0-ap-south-1.pooler.supabase.com
    console.log(`Connecting to IP: ${ip} (Port 5432)...`);

    const client = new Client({
        host: ip,
        port: 5432,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        ssl: {
            rejectUnauthorized: false,
            servername: 'aws-0-ap-south-1.pooler.supabase.com' // Important for SNI
        },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully to IP!');
        const res = await client.query('SELECT NOW()');
        console.log('Query Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

testIp();
