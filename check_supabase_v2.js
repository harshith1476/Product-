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
        const res = await pool.query('SELECT COUNT(*) FROM appointments');
        console.log('Appointments Count:', res.rows[0].count);

        if (parseInt(res.rows[0].count) > 0) {
            const apts = await pool.query('SELECT id, \"slotDate\", status FROM appointments LIMIT 5');
            console.table(apts.rows);
        }
    } catch (e) {
        console.error('Supabase Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkSupabase();
