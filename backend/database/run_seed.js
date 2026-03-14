
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'healthsystem_pg',
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
});

async function runSeed() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Reading SQL file...');
        const sqlPath = path.join(__dirname, 'add_doctors_for_all_hospitals.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing seed script...');
        // Execute line by line or block? The SQL file content is a DO block which is one statement
        // But the file content I wrote earlier was a bit complex.
        // Let's rewrite the SQL file to be simple INSERT statements if DO block fails with node-pg
        // No, DO block works in node-pg if executed as one query.

        await client.query("BEGIN");

        // Split by semicolon might be dangerous if procedural code has semicolons. 
        // But since I wrote a single DO block, it should be treated as one command?
        // Let's try executing the whole thing.

        // Wait, the file I wrote earlier:
        /*
        DO $$ ... END $$;
        */
        // This is a single command.

        await client.query(sql);

        await client.query("COMMIT");
        console.log('Seed completed successfully!');

        client.release();
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await pool.end();
    }
}

runSeed();
