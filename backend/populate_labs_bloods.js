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

async function populateData() {
  try {
    const res = await pool.query('SELECT * FROM hospital_tieups');
    const hospitals = res.rows;
    
    if (hospitals.length === 0) {
        console.log("No hospitals found to clone.");
        return;
    }

    // Clear existing to avoid duplicates in this demo structure
    await pool.query('DELETE FROM labs');
    await pool.query('DELETE FROM blood_banks');
    console.log("Cleared existing labs and blood banks.");

    for (const hospital of hospitals) {
        // Prepare common info
        const name = hospital.name;
        const location = hospital.address;
        const city = hospital.address; // Fallback, using address as city
        
        // Add to labs
        await pool.query(
            `INSERT INTO labs (name, location, city, latitude, longitude, rating, verified, services, open_now, partner_type) 
             VALUES ($1, $2, $3, 0, 0, 4.8, true, $4::jsonb, true, 'partner')`,
            [name, location, city, JSON.stringify(['Blood Test', 'MRI', 'CT Scan', 'X-Ray'])]
        );
        
        // Add to blood_banks
        const defaultBlood = {
            "A+": "Available",
            "A-": "Available",
            "B+": "Available",
            "B-": "Available",
            "AB+": "Urgent",
            "AB-": "Available",
            "O+": "Available",
            "O-": "Limited"
        };
        await pool.query(
            `INSERT INTO blood_banks (name, location, city, latitude, longitude, partner_type, available_blood)
             VALUES ($1, $2, $3, 0, 0, 'partner', $4::jsonb)`,
            [name, location, city, JSON.stringify(defaultBlood)]
        );

        console.log(`Added ${name} to Lab and Blood Bank tables.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

populateData();
