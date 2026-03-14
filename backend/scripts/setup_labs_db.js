import { query } from '../config/postgresql.js';

const setupLabsAndBloodBanks = async () => {
    try {
        console.log('--- Setting up Labs and Blood Banks Tables ---');

        // Diagnostic Labs Table
        const createLabsTable = `
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                rating DECIMAL(2, 1) DEFAULT 0,
                verified BOOLEAN DEFAULT FALSE,
                services JSONB DEFAULT '[]',
                open_now BOOLEAN DEFAULT TRUE,
                partner_type VARCHAR(50) DEFAULT 'normal',
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Blood Banks Table
        const createBloodBanksTable = `
            CREATE TABLE IF NOT EXISTS blood_banks (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                partner_type VARCHAR(50) DEFAULT 'normal',
                available_blood JSONB DEFAULT '{
                    "A+": "Available",
                    "A-": "Available",
                    "B+": "Available",
                    "B-": "Available",
                    "AB+": "Available",
                    "AB-": "Available",
                    "O+": "Available",
                    "O-": "Available"
                }',
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await query(createLabsTable);
        console.log('✅ Labs table ready');

        await query(createBloodBanksTable);
        console.log('✅ Blood Banks table ready');

        // Insert some sample data if empty
        const labsCount = await query('SELECT count(*) FROM labs');
        if (parseInt(labsCount.rows[0].count) === 0) {
            console.log('Inserting sample labs...');
            const insertLab = `
                INSERT INTO labs (name, location, city, latitude, longitude, rating, verified, services, partner_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            await query(insertLab, ['City Advanced Imaging', 'Banjara Hills', 'Hyderabad', 17.4156, 78.4447, 4.8, true, JSON.stringify(['MRI Scan', 'CT Scan', 'Pathology']), 'partner']);
            await query(insertLab, ['Medicare Diagnostics', 'Jubilee Hills', 'Hyderabad', 17.4286, 78.4117, 4.5, true, JSON.stringify(['Blood Test', 'X-Ray', 'ECG']), 'normal']);
        }

        const bbCount = await query('SELECT count(*) FROM blood_banks');
        if (parseInt(bbCount.rows[0].count) === 0) {
            console.log('Inserting sample blood banks...');
            const insertBB = `
                INSERT INTO blood_banks (name, location, city, latitude, longitude, partner_type)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await query(insertBB, ['Red Cross Blood Center', 'Ameerpet', 'Hyderabad', 17.4375, 78.4482, 'partner']);
            await query(insertBB, ['LifeCare Blood Bank', 'Secunderabad', 'Hyderabad', 17.4399, 78.4983, 'normal']);
        }

        console.log('--- Setup Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up tables:', error);
        process.exit(1);
    }
};

setupLabsAndBloodBanks();
