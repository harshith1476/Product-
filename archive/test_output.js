import { getAllPublicHospitalsWithDoctors } from './backend/controllers/hospitalTieUpController.js';

async function testOutput() {
    const req = {};
    const res = {
        json: (data) => {
            console.log(JSON.stringify(data.hospitals[0]?.doctors, null, 2));
            process.exit(0);
        }
    };
    await getAllPublicHospitalsWithDoctors(req, res);
}

testOutput();
