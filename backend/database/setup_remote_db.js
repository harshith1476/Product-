
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // ES module import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env explicitly
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function setupDatabase() {
    if (!process.env.PG_PASSWORD) {
        console.error("❌ ERROR: PG_PASSWORD is missing in .env file. Please add your Supabase database password.");
        process.exit(1);
    }

    try {
        console.log('Connecting to Supabase...');
        const client = await pool.connect();

        console.log('Reading complete-schema.sql...');
        const sqlPath = path.join(__dirname, 'complete-schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema script on remote DB...');
        await client.query(sql);

        console.log('✅ Remote Database Setup Completed Successfully!');
        client.release();
    } catch (err) {
        console.error('❌ Error setting up database:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        if (err.detail) console.error('Error Detail:', err.detail);
    } finally {
        await pool.end();
    }
}

setupDatabase();
