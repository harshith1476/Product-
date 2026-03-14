
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- DB Connection Test ---');
console.log('Host:', process.env.PG_HOST);
console.log('Port:', process.env.PG_PORT);
console.log('User:', process.env.PG_USER);

const { Pool } = pg;
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: parseInt(process.env.PG_PORT),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
});

async function run() {
    try {
        console.log('Attempting to connect...');
        const start = Date.now();
        const client = await pool.connect();
        console.log(`✅ Connected in ${Date.now() - start}ms`);
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('❌ Connection Failed!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        if (err.cause) console.error('Cause:', err.cause.message);
        // console.error('Stack:', err.stack);
    } finally {
        await pool.end();
    }
}

run();
