import { query, pool } from './config/postgresql.js';
import fs from 'fs';

async function fixSchema() {
    console.log('--- Starting Database Schema Fix (ESM + Logging) ---');
    const logFile = './migration_log.txt';
    fs.writeFileSync(logFile, `Started at ${new Date().toISOString()}\n`);

    try {
        console.log('Checking for consultation_fee column...');
        fs.appendFileSync(logFile, 'Checking column info...\n');
        
        const checkSql = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'consultation_fee';
        `;
        const checkResult = await query(checkSql);
        
        fs.appendFileSync(logFile, `Found ${checkResult.rows.length} matches.\n`);

        if (checkResult.rows.length === 0) {
            console.log('Column "consultation_fee" is missing. Adding missing columns...');
            fs.appendFileSync(logFile, 'Altering table...\n');
            
            const alterSql = `
                ALTER TABLE appointments 
                ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS gst DECIMAL(10, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;
            `;
            
            await query(alterSql);
            console.log('Successfully added missing columns to "appointments" table.');
            fs.appendFileSync(logFile, 'Columns added successfully.\n');
        } else {
            console.log('Column "consultation_fee" already exists. No changes needed.');
            fs.appendFileSync(logFile, 'Column already exists.\n');
        }
    } catch (error) {
        console.error('Error fixing schema:', error);
        fs.appendFileSync(logFile, `Error: ${error.message}\n${error.stack}\n`);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('PostgreSQL pool closed.');
        fs.appendFileSync(logFile, 'Pool closed.\n');
    }
}

fixSchema();
