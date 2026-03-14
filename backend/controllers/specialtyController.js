import {
    getAllSpecialties as getAllSpecialtiesDB,
    getSpecialtyByName as getSpecialtyByNameDB,
    getSpecialtyById,
    createSpecialty as createSpecialtyDB,
    updateSpecialty as updateSpecialtyDB,
    deleteSpecialty as deleteSpecialtyDB,
    getDoctorById
} from '../models/postgresModels.js';

// Get all specialties with helpline numbers
export const getAllSpecialties = async (req, res) => {
    try {
        const specialties = await getAllSpecialtiesDB();
        res.json({ success: true, data: specialties });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get single specialty by name
export const getSpecialtyByName = async (req, res) => {
    try {
        const { specialtyName } = req.params;
        const specialty = await getSpecialtyByNameDB(specialtyName);

        if (!specialty) {
            return res.json({ success: false, message: 'Specialty not found' });
        }

        res.json({ success: true, data: specialty });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Create new specialty with helpline
export const createSpecialty = async (req, res) => {
    try {
        const { specialtyName, helplineNumber, availability, status } = req.body;

        // Validate phone number format (basic validation)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(helplineNumber)) {
            return res.json({ success: false, message: 'Invalid phone number format' });
        }

        // Check if specialty already exists
        const existing = await getSpecialtyByNameDB(specialtyName);

        if (existing) {
            return res.json({ success: false, message: 'Specialty already exists' });
        }

        const specialty = await createSpecialtyDB({
            specialtyName,
            helplineNumber,
            availability: availability || '24x7',
            status: status || 'Active',
            updatedBy: req.adminId || null
        });

        res.json({ success: true, message: 'Specialty helpline created successfully', data: specialty });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update specialty helpline
export const updateSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const { helplineNumber, availability, status } = req.body;

        // Validate phone number if provided
        if (helplineNumber) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(helplineNumber)) {
                return res.json({ success: false, message: 'Invalid phone number format' });
            }
        }

        const updateData = {
            helplineNumber,
            availability,
            status,
            updatedBy: req.adminId || null
        };

        const specialty = await updateSpecialtyDB(id, updateData);

        if (!specialty) {
            return res.json({ success: false, message: 'Specialty not found' });
        }

        res.json({ success: true, message: 'Specialty helpline updated successfully', data: specialty });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete specialty
export const deleteSpecialty = async (req, res) => {
    try {
        const { id } = req.params;

        const specialty = await deleteSpecialtyDB(id);

        if (!specialty) {
            return res.json({ success: false, message: 'Specialty not found' });
        }

        res.json({ success: true, message: 'Specialty helpline deleted successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get helpline for appointment (by doctor specialty)
export const getHelplineForAppointment = async (req, res) => {
    try {
        const { docId } = req.params;

        // Get doctor's specialty
        const doctor = await getDoctorById(docId);
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        // Find specialty helpline
        const specialty = await getSpecialtyByNameDB(doctor.speciality);

        if (!specialty) {
            return res.json({ success: false, message: 'Helpline not available for this specialty' });
        }

        res.json({ success: true, data: specialty });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
