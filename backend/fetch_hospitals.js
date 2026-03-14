import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new pg.Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'healthsystem_pg',
    password: process.env.PG_PASSWORD || 'Javali786',
    port: parseInt(process.env.PG_PORT) || 5432,
    ssl: false
});

async function getHospitals() {
  try {
    const res = await pool.query('SELECT * FROM hospital_tieups');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getHospitals();
