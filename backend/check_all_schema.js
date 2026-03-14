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
        console.log('--- Appointments Table Columns ---');
        const res1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments'");
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log('\n--- Doctors Table Columns ---');
        const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors'");
        console.log(JSON.stringify(res2.rows, null, 2));

        console.log('\n--- Hospital Tie-up Doctors Table Columns ---');
        const res3 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hospital_tieup_doctors'");
        console.log(JSON.stringify(res3.rows, null, 2));

        console.log('\n--- Sample Doctor ID 5 in Doctors table ---');
        const res4 = await pool.query("SELECT id, name FROM doctors WHERE id = 5");
        console.log(JSON.stringify(res4.rows, null, 2));

        console.log('\n--- Sample Doctor ID 5 in Hospital Tie-up table ---');
        const res5 = await pool.query("SELECT id, name FROM hospital_tieup_doctors WHERE id = 5");
        console.log(JSON.stringify(res5.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
