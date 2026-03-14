
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});

async function runSeed() {
    const files = [
        'complete-schema.sql',
        'add_hospital_tieups.sql',
        'add_sample_data.sql',
        'add_doctors_for_all_hospitals.sql'
    ];

    try {
        console.log('🚀 Starting Full Database Seeding...');
        const client = await pool.connect();

        for (const file of files) {
            console.log(`\n📄 Processing ${file}...`);
            const sqlPath = path.join(__dirname, file);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            await client.query(sql);
            console.log(`✅ ${file} executed successfully.`);
        }

        console.log('\n✨ All data seeded successfully!');
        client.release();
    } catch (err) {
        console.error('\n❌ Error during seeding:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        await pool.end();
    }
}

runSeed();
