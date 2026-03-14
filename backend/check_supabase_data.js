import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'db.cdlycuzukfjipioepuso.supabase.co',
    database: 'postgres',
    password: 'yKh#6bJSvVB!+Ki',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function checkSupabase() {
    try {
        console.log('--- Checking Supabase Database ---');

        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));

        const aptCount = await pool.query('SELECT COUNT(*) FROM appointments');
        console.log('Supabase Appointments Count:', aptCount.rows[0].count);

        if (parseInt(aptCount.rows[0].count) > 0) {
            const apts = await pool.query('SELECT id, "slotDate", status FROM appointments ORDER BY id DESC LIMIT 5');
            console.table(apts.rows);
        }

        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        console.log('Supabase Users Count:', userCount.rows[0].count);

    } catch (error) {
        console.error('Supabase Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSupabase();
