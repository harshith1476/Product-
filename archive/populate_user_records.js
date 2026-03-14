import { query } from './backend/config/postgresql.js';

async function populateUserRecords() {
    try {
        console.log('Fetching user...');
        const userRes = await query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No user found to add records to.');
            process.exit(0);
        }
        const userId = userRes.rows[0].id;

        console.log(`Adding lab and blood records for user ID: ${userId}`);

        const records = [
            {
                user_id: userId,
                record_type: 'Lab Report',
                title: 'Comprehensive Metabolic Panel',
                description: 'Routine blood test results from hospital visit.',
                doctor_name: 'Dr. Arjun Sharma',
                diagnosis: 'Normal',
                prescription: 'Maintain healthy diet',
                notes: 'Collaborated via Andhra Hospitals',
                is_important: true,
                record_date: new Date('2024-03-01'),
                attachments: JSON.stringify([{ name: 'CMP_Report.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }])
            },
            {
                user_id: userId,
                record_type: 'Blood Report',
                title: 'Complete Blood Count (CBC)',
                description: 'Annual health checkup blood report.',
                doctor_name: 'Dr. Priya Sharma',
                diagnosis: 'Mild Anemia',
                prescription: 'Iron supplements for 30 days',
                notes: 'Collaborated via SAI HOSPITALS',
                is_important: false,
                record_date: new Date('2024-03-10'),
                attachments: JSON.stringify([{ name: 'CBC_Report.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }])
            },
            {
                user_id: userId,
                record_type: 'Lab Report',
                title: 'Lipid Profile',
                description: 'Cholesterol and triglyceride levels.',
                doctor_name: 'Dr. Rajesh Kumar',
                diagnosis: 'High Cholesterol',
                prescription: 'Atorvastatin 10mg',
                notes: 'Collaborated via Aster Ramesh Hospital',
                is_important: true,
                record_date: new Date('2024-02-15'),
                attachments: JSON.stringify([{ name: 'Lipid_Profile.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }])
            }
        ];

        for (const record of records) {
            const sql = `
                INSERT INTO health_records (
                    user_id, record_type, title, description, doctor_name, 
                    diagnosis, prescription, notes, is_important, record_date, attachments
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            const values = [
                record.user_id, record.record_type, record.title, record.description, record.doctor_name,
                record.diagnosis, record.prescription, record.notes, record.is_important, record.record_date, record.attachments
            ];
            await query(sql, values);
            console.log(`Added record: ${record.title}`);
        }

        console.log('All records added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to populate records:', err);
        process.exit(1);
    }
}

populateUserRecords();
