import {
    getAppointmentsByFilters,
    getHealthRecords,
    getAppointmentById,
    getUserById
} from '../models/postgresModels.js';

// Get patient complete history (appointments + medical records)
export const getPatientHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.json({ success: false, message: 'Patient ID is required' });
        }

        // Get patient user data
        const patient = await getUserById(userId);
        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' });
        }

        // Get all appointments for this patient
        const appointments = await getAppointmentsByFilters({ userId }); // Ensure sorted by date DESC in model or sort here
        // The model sorts by created_at ASC currently. We might want DESC for history.
        // We can sort here.
        appointments.sort((a, b) => b.created_at - a.created_at);

        // Get all health records for this patient
        const healthRecords = await getHealthRecords({ userId });
        // Model handles sorting? It does filter but sorting might be default or not.
        // Assuming default sort or sort here.
        healthRecords.sort((a, b) => b.created_at - a.created_at); // Assuming created_at exists or record_date

        // Format patient data
        const patientData = {
            _id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            dob: patient.dob,
            gender: patient.gender,
            image: patient.image
        };

        // Format appointments
        const formattedAppointments = appointments.map(apt => ({
            _id: apt.id,
            date: apt.date, // BIGINT timestamp
            slotDate: apt.slot_date,
            slotTime: apt.slot_time,
            doctor: apt.doctor_data?.name || 'Unknown',
            doctorId: apt.doctor_id,
            doctorSpeciality: apt.doctor_data?.speciality || '',
            doctorImage: apt.doctor_data?.image || '',
            status: apt.cancelled ? 'Cancelled' : (apt.is_completed ? 'Completed' : 'Active'),
            fees: apt.amount,
            mode: apt.mode || 'In-person',
            symptoms: apt.selected_symptoms || [],
            actualPatient: {
                name: apt.actual_patient_name,
                age: apt.actual_patient_age,
                gender: apt.actual_patient_gender,
                relationship: apt.actual_patient_relationship,
                isSelf: apt.actual_patient_is_self
            },
            tokenNumber: apt.token_number,
            statusDetail: apt.status,
            payment: apt.payment || false,
            cancelled: apt.cancelled || false,
            isCompleted: apt.is_completed || false
        }));

        // Format health records
        const formattedRecords = healthRecords.map(record => ({
            _id: record.id,
            appointmentId: record.appointment_id,
            recordType: record.record_type,
            title: record.title,
            description: record.description,
            doctorName: record.doctor_name,
            date: record.record_date || record.created_at,
            files: typeof record.attachments === 'string' ? JSON.parse(record.attachments) : record.attachments,
            tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
            isImportant: record.is_important
        }));

        res.json({
            success: true,
            data: {
                patient: patientData,
                appointments: formattedAppointments,
                healthRecords: formattedRecords,
                totalAppointments: formattedAppointments.length,
                totalRecords: formattedRecords.length
            }
        });

    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.json({ success: false, message: error.message || 'Failed to fetch patient history' });
    }
};

// Get patient by appointment ID (helper for admin panel)
export const getPatientByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID is required' });
        }

        // Get appointment
        const appointment = await getAppointmentById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Get patient data
        const patient = await getUserById(appointment.user_id);
        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' });
        }

        // Get all appointments for this patient
        const allAppointments = await getAppointmentsByFilters({ userId: appointment.user_id });
        allAppointments.sort((a, b) => b.created_at - a.created_at);

        // Get health records
        const healthRecords = await getHealthRecords({ userId: appointment.user_id });

        // Format response
        const isSelf = appointment.actual_patient_is_self;
        const patientData = {
            _id: patient.id,
            name: !isSelf && appointment.actual_patient_name ? appointment.actual_patient_name : patient.name,
            email: patient.email,
            phone: !isSelf && appointment.actual_patient_phone ? appointment.actual_patient_phone : patient.phone,
            dob: patient.dob,
            gender: !isSelf && appointment.actual_patient_gender ? appointment.actual_patient_gender : patient.gender,
            age: !isSelf ? appointment.actual_patient_age : appointment.age || null, // Assuming age in user/appt
            relationship: !isSelf ? appointment.actual_patient_relationship : 'Self',
            image: patient.image
        };

        const formattedAppointments = allAppointments.map(apt => ({
            _id: apt.id,
            date: apt.date,
            slotDate: apt.slot_date,
            slotTime: apt.slot_time,
            doctor: apt.doctor_data?.name || 'Unknown',
            doctorSpeciality: apt.doctor_data?.speciality || '',
            status: apt.cancelled ? 'Cancelled' : (apt.is_completed ? 'Completed' : 'Active'),
            fees: apt.amount,
            mode: apt.mode || 'In-person',
            symptoms: apt.selected_symptoms || [],
            tokenNumber: apt.token_number,
            payment: apt.payment || false,
            cancelled: apt.cancelled || false,
            isCompleted: apt.is_completed || false
        }));

        const formattedRecords = healthRecords.map(record => ({
            _id: record.id,
            appointmentId: record.appointment_id,
            recordType: record.record_type,
            title: record.title,
            description: record.description,
            doctorName: record.doctor_name,
            date: record.record_date || record.created_at,
            files: typeof record.attachments === 'string' ? JSON.parse(record.attachments) : record.attachments,
            tags: typeof record.tags === 'string' ? JSON.parse(record.tags) : record.tags,
            isImportant: record.is_important
        }));

        res.json({
            success: true,
            data: {
                patient: patientData,
                appointments: formattedAppointments,
                healthRecords: formattedRecords,
                currentAppointment: appointment
            }
        });

    } catch (error) {
        console.error('Error fetching patient by appointment:', error);
        res.json({ success: false, message: error.message || 'Failed to fetch patient data' });
    }
};
