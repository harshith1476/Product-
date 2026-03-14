
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

// Construct connection string
const user = process.env.PG_USER;
const password = encodeURIComponent(process.env.PG_PASSWORD);
const host = process.env.PG_HOST;
const port = process.env.PG_PORT;
const database = process.env.PG_DATABASE;

const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;

console.log('Testing with Connection String (masked password):');
console.log(`postgresql://${user}:****@${host}:${port}/${database}?sslmode=require`);

async function test() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection Failed:');
        console.error(err);
    }
}

test();
