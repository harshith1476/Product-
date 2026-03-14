import {
    createConsultation as createConsultationDB,
    getConsultationById as getConsultationByIdDB,
    updateConsultation as updateConsultationDB,
    getConsultationsByUserId as getConsultationsByUserIdDB,
    getConsultationsByDoctorId as getConsultationsByDoctorIdDB,
    getVideoConsultDoctorsQuery as getVideoConsultDoctorsQueryDB,
    getDoctorById as getDoctorByIdDB,
    getUserById as getUserByIdDB,
    updateDoctor as updateDoctorDB
} from '../models/postgresModels.js';
import { query } from '../config/postgresql.js';

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Generate Google Meet link (simplified - in production, use Google Meet API)
const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/${meetingId}`;
};

// Get doctors available for video consultation
export const getVideoConsultDoctors = async (req, res) => {
    try {
        const { lat, lng, distance } = req.query; // distance: '5km', '10km', 'all'

        // Get video consult doctors from DB
        let doctors = await getVideoConsultDoctorsQueryDB();

        // Filter by distance if location provided
        if (lat && lng && distance !== 'all') {
            const maxDistance = parseInt(distance.replace('km', ''));
            doctors = doctors.filter(doctor => {
                const docLat = doctor.location_lat;
                const docLng = doctor.location_lng;

                if (!docLat || !docLng) {
                    return false; // Skip doctors without location
                }
                const dist = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    parseFloat(docLat),
                    parseFloat(docLng)
                );
                return dist <= maxDistance;
            });

            // Add distance to each doctor (and map keys to frontend format)
            doctors = doctors.map(doctor => ({
                _id: doctor.id,
                name: doctor.name,
                image: doctor.image,
                speciality: doctor.speciality,
                degree: doctor.degree,
                experience: doctor.experience,
                fees: doctor.fees,
                hospital: doctor.hospital || '',
                status: doctor.status,
                location: { lat: doctor.location_lat, lng: doctor.location_lng },
                distance: calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    parseFloat(doctor.location_lat),
                    parseFloat(doctor.location_lng)
                )
            }));

            // Sort by distance
            doctors.sort((a, b) => a.distance - b.distance);
        } else {
            // Map keys
            doctors = doctors.map(doctor => ({
                _id: doctor.id,
                name: doctor.name,
                image: doctor.image,
                speciality: doctor.speciality,
                degree: doctor.degree,
                experience: doctor.experience,
                fees: doctor.fees,
                hospital: doctor.hospital || '',
                status: doctor.status,
                location: { lat: doctor.location_lat, lng: doctor.location_lng },
                distance: null
            }));
        }

        res.json({ success: true, doctors });
    } catch (error) {
        console.error('Error fetching video consult doctors:', error);
        res.json({ success: false, message: error.message });
    }
};

// Create video consultation
export const createConsultation = async (req, res) => {
    try {
        const { doctorId, type = 'video' } = req.body;
        const userId = req.body.userId; // From authUser middleware

        // Verify doctor exists and is available for video consult
        const doctor = await getDoctorByIdDB(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.video_consult) {
            return res.json({ success: false, message: 'Doctor does not offer video consultation' });
        }

        if (doctor.status !== 'online' && doctor.status !== 'in-clinic') {
            return res.json({ success: false, message: 'Doctor is not available at the moment' });
        }

        // Generate meeting link
        const meetingLink = generateMeetingLink();
        const meetingId = meetingLink.split('/').pop();

        // Create consultation
        const consultationData = {
            patientId: userId,
            doctorId: doctorId,
            type: type,
            status: 'scheduled',
            meetingLink: meetingLink,
            meetingId: meetingId,
            meetingProvider: 'google-meet',
            scheduledAt: new Date()
        };

        const consultation = await createConsultationDB(consultationData);

        // Update doctor status
        if (updateConsultation) { // Check if imported correctly
            // Wait, I need to update *doctor* status. Import updateDoctor?
            const { updateDoctor } = await import('../models/postgresModels.js');
            await updateDoctor(doctorId, {
                status: 'in-consult',
                current_appointment_id: consultation.id
            });
        }

        res.json({
            success: true,
            consultationId: consultation.id,
            meetingLink: meetingLink,
            message: 'Consultation created successfully'
        });
    } catch (error) {
        console.error('Error creating consultation:', error);
        res.json({ success: false, message: error.message });
    }
};

// Start consultation
export const startConsultation = async (req, res) => {
    try {
        const { consultationId } = req.body;

        const consultation = await getConsultationByIdDB(consultationId);
        if (!consultation) {
            return res.json({ success: false, message: 'Consultation not found' });
        }

        const updated = await updateConsultationDB(consultationId, {
            status: 'ongoing',
            startedAt: new Date()
        });

        res.json({ success: true, consultation: updated });
    } catch (error) {
        console.error('Error starting consultation:', error);
        res.json({ success: false, message: error.message });
    }
};

// End consultation
export const endConsultation = async (req, res) => {
    try {
        const { consultationId, prescription, notes, prescriptionFile } = req.body;

        const consultation = await getConsultationByIdDB(consultationId);
        if (!consultation) {
            return res.json({ success: false, message: 'Consultation not found' });
        }

        const endedAt = new Date();
        const startedAt = consultation.started_at ? new Date(consultation.started_at) : endedAt;
        const duration = Math.round((endedAt - startedAt) / 60000); // Duration in minutes

        const updated = await updateConsultationDB(consultationId, {
            status: 'completed',
            endedAt,
            duration,
            prescription,
            notes,
            prescriptionFile
        });

        // Update doctor status
        // Reset doctor status to online/in-clinic and remove current_appointment_id
        await query('UPDATE doctors SET status = $1, current_appointment_id = NULL WHERE id = $2', ['online', consultation.doctor_id]);

        res.json({ success: true, consultation: updated });
    } catch (error) {
        console.error('Error ending consultation:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get consultation details
export const getConsultation = async (req, res) => {
    try {
        const { consultationId } = req.params;

        const consultation = await getConsultationByIdDB(consultationId);

        if (!consultation) {
            return res.json({ success: false, message: 'Consultation not found' });
        }

        // Populate patient and doctor details
        const patient = await getUserByIdDB(consultation.user_id);
        const doctor = await getDoctorByIdDB(consultation.doctor_id);

        const consultationWithDetails = {
            ...consultation,
            patientId: patient ? { name: patient.name, email: patient.email } : null,
            doctorId: doctor ? { name: doctor.name, speciality: doctor.speciality, image: doctor.image } : null
        };

        res.json({ success: true, consultation: consultationWithDetails });
    } catch (error) {
        console.error('Error fetching consultation:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get user's consultations
export const getUserConsultations = async (req, res) => {
    try {
        const userId = req.body.userId; // From authUser middleware

        const consultations = await getConsultationsByUserIdDB(userId);

        // Populate doctor details manually
        const consultationsWithDetails = await Promise.all(consultations.map(async (c) => {
            const doctor = await getDoctorByIdDB(c.doctor_id);
            return {
                ...c,
                doctorId: doctor ? { name: doctor.name, speciality: doctor.speciality, image: doctor.image } : null
            };
        }));

        res.json({ success: true, consultations: consultationsWithDetails });
    } catch (error) {
        console.error('Error fetching user consultations:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get doctor's consultations
export const getDoctorConsultations = async (req, res) => {
    try {
        const docId = req.body.docId; // From authDoctor middleware

        const consultations = await getConsultationsByDoctorIdDB(docId);

        // Populate patient details manually
        const consultationsWithDetails = await Promise.all(consultations.map(async (c) => {
            const patient = await getUserByIdDB(c.user_id);
            return {
                ...c,
                patientId: patient ? { name: patient.name, email: patient.email } : null
            };
        }));

        res.json({ success: true, consultations: consultationsWithDetails });
    } catch (error) {
        console.error('Error fetching doctor consultations:', error);
        res.json({ success: false, message: error.message });
    }
};
