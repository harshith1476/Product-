
import pg from 'pg';
const { Client } = pg;

const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ca-central-1', 'sa-east-1'
];

const projectRef = 'hrtayvqddtpetpbskycl';
const password = 'VHARSHITH121476$$';
const user = `postgres.${projectRef}`;

async function exhaustRegions() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`Checking ${region}...`);

        const client = new Client({
            host: host,
            port: 5432,
            user: user,
            password: password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        });

        try {
            await client.connect();
            console.log(`✅ FOUND! Region is: ${region}`);
            await client.end();
            process.exit(0);
        } catch (err) {
            // console.log(`   ${region}: ${err.message}`);
            if (!err.message.includes("Tenant or user not found")) {
                console.log(`   ${region}: UNEXPECTED ERROR: ${err.message}`);
            }
        }
    }
    console.log("All regions failed.");
}

exhaustRegions();
