import dotenv from 'dotenv';
dotenv.config();
import { getDoctorById as getDoctorByIdDB } from './models/postgresModels.js';

async function verifyFinal() {
    const docId = 5; // Dr. Sharmila Sharma
    console.log(`Final Verification - Checking Doctor ID: ${docId}`);

    const docData = await getDoctorByIdDB(docId);

    if (docData && docData.name === 'Dr. Sharmila Sharma') {
        console.log('✅ Success: Doctor ID 5 found in main doctors table!');
        console.log('Data:', JSON.stringify(docData, null, 2));
    } else {
        console.log('❌ Failure: Doctor ID 5 still missing from main doctors table.');
    }
}

verifyFinal().catch(err => {
    console.error('Error during final verification:', err);
    process.exit(1);
}).then(() => process.exit(0));
