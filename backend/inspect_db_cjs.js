const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    port: parseInt(process.env.PG_PORT) || 5432,
});

async function inspect() {
    try {
        const docId = 11;
        const res = await pool.query('SELECT id, name, slots_booked FROM doctors WHERE id = $1', [docId]);
        console.log('--- DB Data for Doctor 11 ---');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
