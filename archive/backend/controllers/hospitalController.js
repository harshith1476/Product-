import {
    getAllHospitalTieUps,
    getHospitalTieUpById,
    getAllDoctors,
    getHospitalTieUpDoctors
} from "../models/postgresModels.js";

// API to get all hospitals list for Frontend
const hospitalList = async (req, res) => {
    try {
        const hospitals = await getAllHospitalTieUps();

        // Map to frontend expected format if needed
        const formattedHospitals = hospitals.map(h => ({
            _id: h.id,
            hospitalName: h.name,
            location: h.address,
            contact: h.contact,
            hospitalType: h.type === 'General' ? 'PARTNER' : (h.type === 'Main' ? 'MAIN' : h.type),
            image: h.image // if exists
        })).sort((a, b) => {
            if (a.hospitalType === b.hospitalType) return a.hospitalName.localeCompare(b.hospitalName);
            return a.hospitalType === 'MAIN' ? -1 : 1;
        });

        res.json({ success: true, hospitals: formattedHospitals });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get doctors by hospital ID
const getDoctorsByHospital = async (req, res) => {
    try {
        const { hospitalId } = req.params;

        // Verify hospital exists
        const hospital = await getHospitalTieUpById(hospitalId);
        if (!hospital) {
            return res.json({ success: false, message: "Hospital not found" });
        }

        // Get real doctors for this hospital
        const allDoctors = await getAllDoctors();
        const realDoctors = allDoctors.filter(doc =>
            doc.hospital_id === parseInt(hospitalId) && doc.available
        ).map(doc => ({
            _id: doc.id,
            name: doc.name,
            speciality: doc.speciality,
            degree: doc.degree,
            experience: doc.experience,
            about: doc.about,
            fees: doc.fees,
            address: doc.address_line1 ? { line1: doc.address_line1, line2: doc.address_line2 } : {},
            image: doc.image,
            available: doc.available
        })).sort((a, b) => a.available === b.available ? a.name.localeCompare(b.name) : (a.available ? -1 : 1));

        // Get embedded doctors (if any/fallback)
        const embeddedDoctors = await getHospitalTieUpDoctors(hospitalId);
        // We might want to merge them or just return real doctors depending on requirement.
        // The original code only returned real doctors found in doctorModel.
        // But hospitalTieUpController returns both.
        // I will return real doctors primarily as that matches original hospitalController behavior.
        // If needed, I can append embedded doctors.

        res.json({
            success: true,
            doctors: realDoctors,
            hospital: {
                _id: hospital.id,
                hospitalName: hospital.name,
                location: hospital.address,
                contact: hospital.contact,
                hospitalType: hospital.type
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    hospitalList,
    getDoctorsByHospital
};
