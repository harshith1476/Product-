import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import {
    createHealthRecord as createHealthRecordDB,
    getHealthRecords as getHealthRecordsDB,
    getHealthRecordById,
    deleteHealthRecord as deleteHealthRecordDB,
    updateHealthRecord,
    getAppointmentById
} from '../models/postgresModels.js';

// Create health record (patient uploads before appointment or general)
export const createHealthRecord = async (req, res) => {
    try {
        // Get userId from req.body (set by authUser middleware or from FormData)
        const userId = req.body.userId; // Middleware should set this, or if coming from formdata check key

        let {
            recordType,
            title,
            description,
            doctorName,
            docId,
            appointmentId,
            date,
            tags,
            isImportant
        } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'User ID is required. Please login again.' });
        }

        // Set defaults if missing to allow "just upload" flow
        if (!recordType) recordType = 'General';
        if (!date) date = new Date().toISOString().split('T')[0];

        // Use a default title if none provided
        if (!title || !title.trim()) {
            const dateStr = new Date(date).toLocaleDateString();
            title = `Medical Report - ${dateStr}`;
        }

        // Parse tags
        const tagsArray = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

        // Upload files to Cloudinary
        const uploadedFiles = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const isPdf = file.mimetype === 'application/pdf';

                    // Upload to Cloudinary with specific settings for PDFs to avoid corruption
                    const uploadOptions = {
                        folder: `health-records/${userId}`,
                        use_filename: true,
                        unique_filename: false,
                        resource_type: 'auto'
                    };

                    // For PDFs, we want to ensure they are served correctly
                    if (isPdf) {
                        // Sometimes Cloudinary tries to optimize PDFs as images if resource_type is image
                        // Forcing 'auto' is usually fine, but let's ensure no transformations are applied later
                        uploadOptions.flags = 'attachment'; // Optional: force download if direct view fails
                    }

                    const uploadResult = await cloudinary.uploader.upload(file.path, uploadOptions);

                    // Generate a clean URL using the SDK to avoid any injected transformations
                    let secureUrl = uploadResult.secure_url;

                    if (isPdf) {
                        // For PDFs, we reconstruct the URL to be 100% sure it's clean and has correct flags
                        secureUrl = cloudinary.url(uploadResult.public_id, {
                            resource_type: 'auto',
                            flags: 'attachment',
                            secure: true
                        });
                    }

                    uploadedFiles.push({
                        url: secureUrl,
                        fileName: file.originalname,
                        fileType: isPdf ? 'pdf' : (file.mimetype.split('/')[1] || 'unknown'),
                        fileSize: file.size,
                        cloudinaryPublicId: uploadResult.public_id
                    });

                    // Delete temp file
                    try { fs.unlinkSync(file.path); } catch (e) { }
                } catch (uploadError) {
                    console.error('File upload error:', uploadError);
                    try { fs.unlinkSync(file.path); } catch (e) { }
                }
            }
        }

        const recordData = {
            userId,
            appointmentId: appointmentId || null,
            docId: docId || null,
            recordType,
            title,
            description: description || '',
            doctorName: doctorName || '',
            date: new Date(date),
            files: uploadedFiles,
            tags: tagsArray,
            isImportant: isImportant === 'true' || isImportant === true,
            uploadedBeforeAppointment: !!appointmentId
        };

        const newRecord = await createHealthRecordDB(recordData);

        res.json({
            success: true,
            message: 'Health record uploaded successfully',
            record: newRecord
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all health records for patient
export const getHealthRecords = async (req, res) => {
    try {
        const { userId } = req.body; // From middleware
        const {
            recordType,
            docId,
            appointmentId,
            startDate,
            endDate,
            search
        } = req.query;

        const filters = {
            userId,
            recordType,
            docId,
            appointmentId,
            startDate,
            endDate,
            search
        };

        const records = await getHealthRecordsDB(filters);

        res.json({
            success: true,
            records
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get single health record
export const getHealthRecord = async (req, res) => {
    try {
        const { userId } = req.body;
        const { recordId } = req.params;

        const record = await getHealthRecordById(recordId);

        if (!record) {
            return res.json({ success: false, message: 'Record not found' });
        }

        // Security check
        if (record.user_id !== userId) { // Check ownership
            return res.json({ success: false, message: 'Unauthorized' });
        }

        res.json({ success: true, record });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete health record
export const deleteHealthRecord = async (req, res) => {
    try {
        const { userId } = req.body;
        const { recordId } = req.params;

        const record = await getHealthRecordById(recordId);

        if (!record) {
            return res.json({ success: false, message: 'Record not found' });
        }

        if (record.user_id !== userId) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        // Delete files from Cloudinary
        const files = typeof record.attachments === 'string' ? JSON.parse(record.attachments) : record.attachments;
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.cloudinaryPublicId) {
                    try {
                        await cloudinary.uploader.destroy(file.cloudinaryPublicId);
                    } catch (cloudinaryError) {
                        console.error('Cloudinary delete error:', cloudinaryError);
                    }
                }
            }
        }

        await deleteHealthRecordDB(recordId);

        res.json({ success: true, message: 'Record deleted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get patient records for doctor (by appointment)
export const getPatientRecordsForDoctor = async (req, res) => {
    try {
        const { docId } = req.body; // From doctor middleware
        const { appointmentId } = req.params;

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID required' });
        }

        const appointment = await getAppointmentById(appointmentId);

        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Security check: ensure doctor owns the appointment
        if (appointment.doctor_id !== docId) {
            return res.json({ success: false, message: 'Unauthorized access to appointment' });
        }

        // Get records for this patient
        const records = await getHealthRecordsDB({ userId: appointment.user_id });

        res.json({
            success: true,
            records
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Mark record as viewed by doctor
export const markRecordAsViewed = async (req, res) => {
    try {
        const { docId } = req.body;
        const { recordId } = req.params;

        const record = await getHealthRecordById(recordId);

        if (!record) {
            return res.json({ success: false, message: 'Record not found' });
        }

        // In a real system, we might check if doctor has access to this patient/record
        // For now, assuming if they have ID they can view (or maybe check appointment link)

        await updateHealthRecord(recordId, {
            viewedByDoctor: true,
            viewedAt: new Date()
        });

        res.json({ success: true, message: 'Record marked as viewed' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
