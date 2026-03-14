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

async function syncDoctor() {
    try {
        console.log('Checking hospital_tieup_doctors for ID 5...');
        const hRes = await pool.query('SELECT * FROM hospital_tieup_doctors WHERE id = 5');
        const hDoc = hRes.rows[0];

        if (!hDoc) {
            console.error('Doctor 5 not found in hospital_tieup_doctors!');
            return;
        }
        console.log('Found hospital doctor:', hDoc.name);

        console.log('Checking main doctors for ID 5...');
        const dRes = await pool.query('SELECT * FROM doctors WHERE id = 5');
        if (dRes.rows[0]) {
            console.log('Doctor 5 already exists in main doctors table.');
            return;
        }

        console.log('Inserting doctor 5 into main doctors table...');
        // We need to match the columns. Based on previous research and common patterns:
        // name, email, password, image, speciality, degree, experience, about, available, fees, address_line1, address_line2, date, slots_booked, hospital_id

        // Let's get the hospital name
        const hospitalRes = await pool.query('SELECT name FROM hospital_tieups WHERE id = $1', [hDoc.hospital_tieup_id]);
        const hospitalName = hospitalRes.rows[0]?.name || 'Hospital';

        const insertQuery = `
            INSERT INTO doctors (
                id, name, email, password, image, speciality, degree, experience,
                about, available, fees, address_line1, address_line2, date, slots_booked, hospital_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

        const values = [
            5,
            hDoc.name,
            hDoc.email || `sharmila.sharma@${hospitalName.toLowerCase().replace(/\s+/g, '')}.pms.local`,
            '$2b$10$C8.u4n5vH5.u4n5vH5.u4n5vH5.u4n5vH5.u4n5vH5.u4n5vH', // Dummy hash
            hDoc.image || '',
            hDoc.specialization || 'General',
            hDoc.qualification || 'MBBS',
            hDoc.experience || '0',
            hDoc.about || `Specialist at ${hospitalName}`,
            hDoc.available !== undefined ? hDoc.available : true,
            hDoc.fees || 500,
            'Hospital Address',
            '',
            Date.now(),
            '{}',
            hDoc.hospital_tieup_id
        ];

        await pool.query(insertQuery, values);
        console.log('✅ Successfully synced doctor 5 to main doctors table.');

    } catch (err) {
        console.error('Error during sync:', err);
    } finally {
        await pool.end();
    }
}

syncDoctor();
