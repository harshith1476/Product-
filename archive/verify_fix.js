import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { getDoctorById as getDoctorByIdDB, getHospitalTieUpDoctorById as getHospitalTieUpDoctorByIdDB, getHospitalTieUpById as getHospitalTieUpByIdDB } from './backend/models/postgresModels.js';

async function verifyFix() {
    const docId = 5; // Dr. Sharmila Sharma
    console.log(`Checking Doctor ID: ${docId}`);

    let docData = await getDoctorByIdDB(docId);
    console.log(`Found in main doctors: ${!!docData}`);

    if (!docData) {
        console.log('Checking hospital tie-up doctors...');
        const hospitalDoc = await getHospitalTieUpDoctorByIdDB(docId);
        if (hospitalDoc) {
            console.log('Found in hospital doctors:', hospitalDoc.name);
            const hospital = await getHospitalTieUpByIdDB(hospitalDoc.hospital_tieup_id);
            console.log('Associated Hospital:', hospital?.name);

            docData = {
                ...hospitalDoc,
                speciality: hospitalDoc.specialization,
                degree: hospitalDoc.qualification,
                fees: hospitalDoc.fees || 500,
                isHospitalDoctor: true
            };
        }
    }

    if (docData) {
        console.log('✅ Doctor data successfully prepared for booking:');
        console.log('Name:', docData.name);
        console.log('Speciality:', docData.speciality);
        console.log('Is Hospital Doctor:', !!docData.isHospitalDoctor);
    } else {
        console.log('❌ Doctor still not found!');
    }
}

verifyFix().catch(console.error);
