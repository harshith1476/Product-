
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const regions = [
    'ap-south-1',      // Mumbai
    'ap-southeast-1',  // Singapore
    'us-east-1',       // N. Virginia
    'eu-central-1',    // Frankfurt
    'us-west-2'        // Oregon
];

const password = process.env.PG_PASSWORD;
const projectRef = 'hrtayvqddtpetpbskycl';
const user = `postgres.${projectRef}`;

async function testRegions() {
    console.log(`Testing regions for project: ${projectRef}`);
    console.log(`Using password: ${password}`);

    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`--- Testing Region: ${region} (${host}) ---`);

        const client = new Client({
            host: host,
            port: 5432,
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
    console.log("All common regions failed.");
}

testRegions();
