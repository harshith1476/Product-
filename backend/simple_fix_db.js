import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'healthsystem_pg',
    password: 'Javali786',
    port: 5432,
});

async function run() {
    console.log('Attempting to add missing columns to appointments table...');
    try {
        const res = await pool.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS gst DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;
        `);
        console.log('Columns added successfully (or already existed).');
    } catch (err) {
        console.error('Error executing query:', err.message);
    } finally {
        await pool.end();
        console.log('Pool closed.');
    }
}

run();
