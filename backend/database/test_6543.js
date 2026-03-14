
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const regions = [
    'ap-south-1',
    'ap-southeast-1',
    'us-east-1'
];

const password = process.env.PG_PASSWORD;
const projectRef = 'hrtayvqddtpetpbskycl';
const user = `postgres.${projectRef}`;

async function testRegions6543() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`--- Testing Region: ${region} (Port 6543 - Transaction) ---`);

        const client = new Client({
            host: host,
            port: 6543,
            user: user,
            password: password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS in region: ${region}`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ FAILED in region ${region}: ${err.message}`);
        }
    }
}

testRegions6543();
