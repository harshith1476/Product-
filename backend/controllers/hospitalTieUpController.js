import {
    getAllHospitalTieUps as getAllHospitalTieUpsDB,
    createHospitalTieUp as createHospitalTieUpDB,
    updateHospitalTieUp as updateHospitalTieUpDB,
    deleteHospitalTieUp as deleteHospitalTieUpDB,
    getPublicHospitalTieUps as getPublicHospitalTieUpsDB,
    getHospitalTieUpById as getHospitalTieUpByIdDB,
    getHospitalTieUpDoctors as getHospitalTieUpDoctorsDB,
    addHospitalTieUpDoctor as addHospitalTieUpDoctorDB,
    updateHospitalTieUpDoctor as updateHospitalTieUpDoctorDB,
    deleteHospitalTieUpDoctor as deleteHospitalTieUpDoctorDB,
    createDoctor as createDoctorDB,
    getDoctorByEmail as getDoctorByEmailDB,
    getAllDoctors as getAllDoctorsDB,
    updateDoctor as updateDoctorDB
} from "../models/postgresModels.js";
import { query } from "../config/postgresql.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import fs from "fs";
import csv from "csv-parser";
import { createReadStream } from "fs";
import { sendDoctorWelcomeEmail } from "../services/emailService.js";

// Helper function to generate password
const generatePassword = () => {
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const randomPart = Array.from({ length: 5 }, () =>
        randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    ).join('');
    return `pms${randomPart}`;
}

// Helper function to generate employee ID
const generateEmployeeId = () => {
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PMS${randomNum}`;
}

// Get all hospitals (for admin)
const getHospitals = async (req, res) => {
    try {
        const hospitals = await getAllHospitalTieUpsDB();
        const allDoctors = await getAllDoctorsDB();

        const hospitalsWithDoctors = await Promise.all(hospitals.map(async (hospital) => {
            const embeddedDoctors = await getHospitalTieUpDoctorsDB(hospital.id);
            const assignedRealDoctors = allDoctors.filter(doc =>
                doc.hospital_id === hospital.id
            ).map(doc => ({
                _id: doc.id,
                name: doc.name,
                qualification: doc.degree || 'MBBS',
                specialization: doc.speciality || hospital.specialization,
                experience: parseInt(doc.experience) || 0,
                image: doc.image || '',
                available: doc.available,
                showOnHospitalPage: true
            }));

            const realDoctorNames = new Set(assignedRealDoctors.map(d => d.name.toLowerCase()));
            const validEmbeddedDoctors = embeddedDoctors.filter(doc => {
                if (doc.name && realDoctorNames.has(doc.name.toLowerCase())) return false;
                return true;
            });

            return {
                ...hospital,
                showOnHome: hospital.show_on_home,
                _id: hospital.id,
                doctors: [...assignedRealDoctors, ...validEmbeddedDoctors]
            };
        }));

        res.json({ success: true, hospitals: hospitalsWithDoctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add a new hospital
const addHospital = async (req, res) => {
    try {
        const { name, address, contact, specialization, type, showOnHome } = req.body;
        if (!name || !address || !contact || !specialization) {
            return res.json({ success: false, message: "Missing required details" });
        }
        await createHospitalTieUpDB({
            name, address, contact, specialization,
            type: type || "General",
            showOnHome: showOnHome || false
        });
        res.json({ success: true, message: "Hospital Added Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update hospital details
const updateHospital = async (req, res) => {
    try {
        const { id, name, address, contact, specialization, type, showOnHome } = req.body;
        if (!id) return res.json({ success: false, message: "Hospital ID is required" });
        await updateHospitalTieUpDB(id, { name, address, contact, specialization, type, showOnHome });
        res.json({ success: true, message: "Hospital Updated Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a hospital
const deleteHospital = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.json({ success: false, message: "Hospital ID is required" });
        await deleteHospitalTieUpDB(id);
        res.json({ success: true, message: "Hospital Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get public hospitals (showOnHome: true)
const getPublicHospitals = async (req, res) => {
    try {
        const hospitals = await getPublicHospitalTieUpsDB();
        const formattedHospitals = hospitals.map(h => ({ ...h, _id: h.id }));
        res.json({ success: true, hospitals: formattedHospitals });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all public hospitals with doctors (for frontend hospital listing page)
const getAllPublicHospitalsWithDoctors = async (req, res) => {
    try {
        const hospitals = await getAllHospitalTieUpsDB();
        const allDoctors = await getAllDoctorsDB();
        const hospitalsWithDoctors = await Promise.all(hospitals.map(async (hospital) => {
            const embeddedDoctors = await getHospitalTieUpDoctorsDB(hospital.id);
            const assignedRealDoctors = allDoctors.filter(doc =>
                doc.hospital_id === hospital.id && doc.available
            ).map(doc => ({
                _id: doc.id,
                name: doc.name,
                qualification: doc.degree || 'MBBS',
                specialization: doc.speciality || hospital.specialization,
                experience: parseInt(doc.experience) || 0,
                image: doc.image || '',
                available: doc.available,
                slots_booked: doc.slots_booked || {},
                isHospitalDoctor: true,
                showOnHospitalPage: true
            }));
            const realDoctorNames = new Set(assignedRealDoctors.map(d => d.name.toLowerCase()));
            const validEmbeddedDoctors = embeddedDoctors.filter(doc => {
                if (doc.name && realDoctorNames.has(doc.name.toLowerCase())) return false;
                return doc.show_on_hospital_page && doc.name && !doc.name.includes('Sample Doctor');
            }).map(doc => ({
                ...doc,
                _id: doc.id,
                isHospitalDoctor: true,
                slots_booked: doc.slots_booked || {}
            }));
            return {
                ...hospital,
                _id: hospital.id,
                doctors: [...assignedRealDoctors, ...validEmbeddedDoctors]
            };
        }));
        res.json({ success: true, hospitals: hospitalsWithDoctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get specific hospital details (public)
const getHospitalDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined' || id === 'null') {
            return res.json({ success: false, message: "Invalid Hospital ID" });
        }

        const hospital = await getHospitalTieUpByIdDB(id);
        if (!hospital) return res.json({ success: false, message: "Hospital not found" });
        const allDoctors = await getAllDoctorsDB();
        const embeddedDoctors = await getHospitalTieUpDoctorsDB(id);
        const assignedRealDoctors = allDoctors.filter(doc =>
            doc.hospital_id === parseInt(id) && doc.available
        ).map(doc => ({
            _id: doc.id,
            name: doc.name,
            qualification: doc.degree || 'MBBS',
            specialization: doc.speciality || hospital.specialization,
            experience: parseInt(doc.experience) || 0,
            image: doc.image || '',
            available: doc.available,
            slots_booked: doc.slots_booked || {},
            showOnHospitalPage: true,
            isHospitalDoctor: true
        }));
        
        const realDoctorNames = new Set(assignedRealDoctors.map(d => d.name.toLowerCase()));
        
        const validEmbeddedDoctors = embeddedDoctors.filter(doc => {
            if (doc.name && realDoctorNames.has(doc.name.toLowerCase())) return false;
            return doc.show_on_hospital_page && doc.name && !doc.name.includes('Sample Doctor');
        }).map(doc => ({
            ...doc,
            _id: doc.id,
            isHospitalDoctor: true,
            slots_booked: doc.slots_booked || {}
        }));
        res.json({ success: true, hospital: { ...hospital, _id: hospital.id, doctors: [...assignedRealDoctors, ...validEmbeddedDoctors] } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Aggregated doctors
const getAllHospitalDoctors = async (req, res) => {
    try {
        const hospitals = await getPublicHospitalTieUpsDB();
        const allRealDoctors = await getAllDoctorsDB();
        let finalDoctors = [];
        allRealDoctors.filter(doc => doc.hospital_id && doc.available).forEach(doc => {
            const hospital = hospitals.find(h => h.id === doc.hospital_id);
            if (hospital) {
                finalDoctors.push({
                    _id: doc.id, name: doc.name, qualification: doc.degree || 'MBBS',
                    specialization: doc.speciality || hospital.specialization,
                    experience: parseInt(doc.experience) || 0, image: doc.image || '',
                    available: doc.available, showOnHospitalPage: true, hospitalName: hospital.name,
                    slots_booked: doc.slots_booked || {},
                    address: { line1: hospital.address, line2: hospital.specialization },
                    isHospitalDoctor: true, hospitalId: hospital.id
                });
            }
        });
        for (const hospital of hospitals) {
            const embedded = await getHospitalTieUpDoctorsDB(hospital.id);
            const doctorsToAdd = embedded.filter(doc => !finalDoctors.some(fd => fd.name.toLowerCase() === doc.name.toLowerCase())).map(doc => ({
                ...doc, _id: doc.id, hospitalName: hospital.name,
                address: { line1: hospital.address, line2: hospital.specialization },
                slots_booked: doc.slots_booked || {},
                isHospitalDoctor: true, hospitalId: hospital.id
            }));
            finalDoctors = [...finalDoctors, ...doctorsToAdd];
        }
        res.json({ success: true, doctors: finalDoctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor Management
const addDoctorToHospital = async (req, res) => {
    try {
        const { hospitalId, doctorData } = req.body;

        if (!hospitalId || hospitalId === 'undefined') {
            return res.json({ success: false, message: "Hospital ID is required" });
        }

        const hospital = await getHospitalTieUpByIdDB(hospitalId);
        if (!hospital) return res.json({ success: false, message: "Hospital not found" });
        let email = doctorData.email;
        if (!email) {
            const namePart = doctorData.name.toLowerCase().replace(/\s+/g, '.');
            email = `${namePart}@${hospital.name.toLowerCase().replace(/\s+/g, '')}.pms.local`;
        }
        const existing = await getDoctorByEmailDB(email);
        if (existing) return res.json({ success: false, message: "Doctor already exists" });
        const password = doctorData.password || generatePassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorData.name)}&background=667eea&color=fff`;

        // Prepare doctor object for DB with correct field mapping
        const dbDoctorData = {
            ...doctorData,
            email,
            password: hashedPassword,
            image,
            hospitalId: hospital.id,
            hospital: hospital.name,
            speciality: doctorData.specialization, // Map specialization to speciality
            degree: doctorData.qualification,      // Map qualification to degree
            fees: doctorData.fees || 500,          // Default fees
            about: doctorData.about || `Doctor at ${hospital.name}`,
            date: Date.now()
        };

        await createDoctorDB(dbDoctorData);
        await addHospitalTieUpDoctorDB(hospitalId, {
            ...doctorData,
            image,
            available: true,
            showOnHospitalPage: true
        });
        res.json({ success: true, message: "Doctor Added", doctor: { email, password } });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateDoctorInHospital = async (req, res) => {
    try {
        const { doctorId, doctorData } = req.body;
        await updateHospitalTieUpDoctorDB(doctorId, doctorData);
        res.json({ success: true, message: "Doctor Updated Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteDoctorFromHospital = async (req, res) => {
    try {
        const { doctorId } = req.body;
        await deleteHospitalTieUpDoctorDB(doctorId);
        res.json({ success: true, message: "Doctor Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const bulkAddHospitalDoctorsPreview = async (req, res) => {
    try {
        const file = req.file;
        const { hospitalId } = req.body;
        if (!file || !hospitalId) return res.json({ success: false, message: "Missing file or hospitalId" });
        const hospital = await getHospitalTieUpByIdDB(hospitalId);
        if (!hospital) return res.json({ success: false, message: "Hospital not found" });
        const workbook = XLSX.readFile(file.path);
        const doctorsData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const preview = [];
        const errors = [];
        for (let i = 0; i < doctorsData.length; i++) {
            const doc = doctorsData[i];
            if (!doc.name || !doc.email) { errors.push({ row: i + 2, reason: "Missing data" }); continue; }
            const exists = await getDoctorByEmailDB(doc.email.toLowerCase());
            if (exists) { errors.push({ row: i + 2, reason: "Exists" }); continue; }
            preview.push({ ...doc, password: generatePassword(), employeeId: generateEmployeeId() });
        }
        const summary = {
            total: doctorsData.length,
            valid: preview.length,
            invalid: errors.length
        };

        res.json({ success: true, preview, errors, summary });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const bulkAddHospitalDoctors = async (req, res) => {
    try {
        const { hospitalId, previewData } = req.body;
        const hospital = await getHospitalTieUpByIdDB(hospitalId);
        const results = {
            total: previewData.length,
            successful: 0,
            failed: 0,
            details: {
                success: [],
                errors: []
            }
        };

        for (const doc of previewData) {
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(doc.password || generatePassword(), salt);
                await createDoctorDB({ ...doc, password: hashedPassword, hospitalId: hospital.id });
                await addHospitalTieUpDoctorDB(hospitalId, { ...doc, available: true, showOnHospitalPage: true });
                results.successful++;
                results.details.success.push({ name: doc.name, email: doc.email, password: doc.password, employeeId: doc.employeeId });
            } catch (err) {
                results.failed++;
                results.details.errors.push({ name: doc.name, email: doc.email, reason: err.message });
            }
        }
        res.json({ success: true, message: "Bulk Upload Complete", results });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const migrateEmbeddedDoctors = async (req, res) => {
    res.json({ success: true, message: "Migration logic not implemented yet" });
}

export {
    getHospitals,
    addHospital,
    updateHospital,
    deleteHospital,
    getPublicHospitals,
    getAllPublicHospitalsWithDoctors,
    getHospitalDetails,
    getAllHospitalDoctors,
    addDoctorToHospital,
    updateDoctorInHospital,
    deleteDoctorFromHospital,
    bulkAddHospitalDoctorsPreview,
    bulkAddHospitalDoctors,
    migrateEmbeddedDoctors
}
