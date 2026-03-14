import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'healthsystem_pg',
    password: 'Javali786',
    port: 5432,
});

async function verify() {
    console.log('--- Verifying Database Columns ---');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' 
            AND column_name IN ('consultation_fee', 'platform_fee', 'gst', 'cost_breakdown');
        `);
        console.log('Found columns:');
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
        
        if (res.rows.length >= 4) {
            console.log('✅ All missing columns are now present.');
        } else {
            console.log('❌ Some columns are still missing.');
        }
    } catch (err) {
        console.error('Verification error:', err.message);
    } finally {
        await pool.end();
        console.log('Pool closed.');
    }
}

verify();
