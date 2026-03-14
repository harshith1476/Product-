import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

async function check() {
    try {
        console.log('--- Doctors Table ---');
        const res1 = await pool.query("SELECT * FROM doctors WHERE id = 5");
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log('\n--- Hospital Tie-up Doctors Table ---');
        const res2 = await pool.query("SELECT * FROM hospital_tieup_doctors WHERE id = 5");
        console.log(JSON.stringify(res2.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
