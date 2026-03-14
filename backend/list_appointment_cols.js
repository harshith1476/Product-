import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'healthsystem_pg',
    password: 'Javali786',
    port: 5432,
});

async function listColumns() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments'");
        console.log('--- Appointments Table Columns ---');
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listColumns();
