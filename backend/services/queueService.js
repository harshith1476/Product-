import {
    getAppointmentById,
    updateAppointment,
    getDoctorById,
    updateDoctor,
    getAppointmentsByFilters
} from "../models/postgresModels.js";
import { query } from "../config/postgresql.js";

// Calculate queue position and wait time for an appointment
export const calculateQueuePosition = async (appointmentId, docId, slotDate) => {
    try {
        // Get all appointments for the doctor on the same date
        const appointments = await getAppointmentsByFilters({
            docId,
            slotDate,
            cancelled: false,
            isCompleted: false,
            status: ['pending', 'in-queue', 'in-consult']
        });

        // Get current appointment
        const currentAppointment = await getAppointmentById(appointmentId);
        if (!currentAppointment) return null;

        // Find position in queue
        let appointmentsBefore = 0;
        if (currentAppointment.token_number) {
            appointmentsBefore = appointments.filter(apt => {
                return (apt.token_number || 0) < currentAppointment.token_number;
            }).length;
        } else {
            const currentIndex = appointments.findIndex(apt => apt.id === currentAppointment.id);
            appointmentsBefore = currentIndex >= 0 ? currentIndex : 0;
        }

        const queuePosition = appointmentsBefore + 1;

        // Get doctor's average consultation time and current status
        const doctor = await getDoctorById(docId);
        // Note: DB column is average_consultation_time (snake_case)
        const avgConsultTime = doctor?.average_consultation_time || 15;
        const currentAppointmentId = doctor?.current_appointment_id;

        // If doctor is consulting, count only appointments before the current consulting one
        let appointmentsToWait = appointmentsBefore;
        if (currentAppointmentId && currentAppointmentId.toString() !== appointmentId.toString()) {
            const currentConsulting = appointments.find(apt => apt.id === currentAppointmentId);
            if (currentConsulting && (currentConsulting.token_number || 0) > (currentAppointment.token_number || 0)) {
                appointmentsToWait = 0;
            }
        }

        // Calculate estimated wait time
        const estimatedWaitTime = appointmentsToWait * avgConsultTime;

        return {
            queuePosition: queuePosition > 0 ? queuePosition : 1,
            estimatedWaitTime: estimatedWaitTime >= 0 ? estimatedWaitTime : 0,
            totalInQueue: appointments.length
        };
    } catch (error) {
        console.error('Error calculating queue position:', error);
        return null;
    }
}

// Assign token number to new appointment
export const assignTokenNumber = async (docId, slotDate) => {
    try {
        const appointments = await getAppointmentsByFilters({
            docId,
            slotDate,
            cancelled: false
        });

        let nextToken = 1;
        if (appointments.length > 0) {
            const maxToken = Math.max(...appointments.map(apt => apt.token_number || 0));
            nextToken = maxToken + 1;
        }

        return nextToken;
    } catch (error) {
        console.error('Error assigning token number:', error);
        return 1;
    }
}

// Get current queue status for a doctor
export const getDoctorQueueStatus = async (docId, slotDate) => {
    try {
        if (!docId || !slotDate) {
            console.error('Missing docId or slotDate');
            return {
                status: 'in-clinic',
                currentAppointmentId: null,
                queueLength: 0,
                appointments: []
            };
        }

        const appointments = await getAppointmentsByFilters({
            docId,
            slotDate,
            cancelled: false,
            isCompleted: false,
            status: ['pending', 'in-queue', 'in-consult']
        });

        // Sort by token number
        appointments.sort((a, b) => (a.token_number || 0) - (b.token_number || 0));

        const doctor = await getDoctorById(docId);
        const currentStatus = doctor?.status || 'in-clinic';
        const currentAppointmentId = doctor?.current_appointment_id || null;

        const appointmentsWithPosition = appointments.map((apt, index) => {
            const position = index + 1;
            const userData = apt.user_data || {};

            let patientName = userData.name || 'Unknown Patient';

            if (apt.actual_patient_name && (!apt.actual_patient_is_self)) {
                patientName = apt.actual_patient_name;
            }

            return {
                _id: apt.id,
                id: apt.id,
                tokenNumber: apt.token_number || position,
                patientName: patientName,
                slotTime: apt.slot_time,
                status: apt.status || 'pending',
                queuePosition: position
            };
        });

        return {
            status: currentStatus,
            currentAppointmentId,
            queueLength: appointments.length,
            appointments: appointmentsWithPosition
        };
    } catch (error) {
        console.error('Error getting queue status:', error);
        return null;
    }
}

// Update appointment status in queue
export const updateAppointmentStatus = async (appointmentId, status) => {
    try {
        const appointment = await getAppointmentById(appointmentId);
        if (!appointment) return false;

        const updateData = { status };
        let sql = 'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP';
        const params = [status];
        let paramCount = 2;

        if (status === 'in-consult') {
            const now = Date.now();
            sql += `, actual_start_time = $${paramCount++}`;
            params.push(now);
        } else if (status === 'completed') {
            const now = Date.now();
            sql += `, actual_end_time = $${paramCount++}, is_completed = $${paramCount++}`;
            params.push(now);
            params.push(true);

            if (appointment.actual_start_time) {
                const duration = Math.round((now - parseInt(appointment.actual_start_time)) / (1000 * 60));
                sql += `, consultation_duration = $${paramCount++}`;
                params.push(duration);
            }
        }

        sql += ` WHERE id = $${paramCount}`;
        params.push(appointmentId);

        await query(sql, params);
        return true;
    } catch (error) {
        console.error('Error updating appointment status:', error);
        return false;
    }
};

// Check for delayed appointments
export const checkDelayedAppointments = async (docId, slotDate) => {
    try {
        const appointments = await getAppointmentsByFilters({
            docId,
            slotDate,
            cancelled: false,
            isCompleted: false,
            status: ['pending', 'in-queue']
        });

        const delayedAppointments = [];

        for (const apt of appointments) {
            if (!apt.slot_time) continue;
            const [hour, minute] = apt.slot_time.split(':').map(Number);
            const appointmentTime = new Date();
            appointmentTime.setHours(hour, minute, 0, 0);

            const currentDateTime = new Date();
            const delayMinutes = Math.round((currentDateTime - appointmentTime) / (1000 * 60));

            // apt.is_delayed is from DB
            if (delayMinutes > 15 && !apt.is_delayed) {
                const userData = apt.user_data || {};
                let patientName = userData.name || 'Unknown Patient';
                if (apt.actual_patient_name && !apt.actual_patient_is_self) {
                    patientName = apt.actual_patient_name;
                }
                delayedAppointments.push({
                    appointmentId: apt.id,
                    delayMinutes,
                    patientName: patientName,
                    tokenNumber: apt.token_number || 0
                });
            }
        }

        return delayedAppointments;
    } catch (error) {
        console.error('Error checking delayed appointments:', error);
        return [];
    }
}

// Get smart scheduling suggestions
export const getSmartSchedulingSuggestions = async (docId, slotDate, currentAppointmentId) => {
    try {
        const suggestions = [];

        // Get all pending appointments except current one
        const allPending = await getAppointmentsByFilters({
            docId,
            slotDate,
            cancelled: false,
            isCompleted: false,
            status: ['pending', 'in-queue']
        });

        // Filter out current appointment if provided
        const pendingAppointments = allPending.filter(a => a.id != currentAppointmentId)
            .sort((a, b) => (a.token_number || 0) - (b.token_number || 0));

        // Get current appointment
        const currentAppointment = currentAppointmentId
            ? await getAppointmentById(currentAppointmentId)
            : null;

        if (currentAppointment && !currentAppointment.is_completed) {
            if (currentAppointment.status === 'no-show') {
                if (pendingAppointments.length > 0) {
                    const nextAppt = pendingAppointments[0];
                    const userData = nextAppt.user_data || {};
                    suggestions.push({
                        type: 'pull-next',
                        message: 'Pull next patient - Current patient no-show',
                        nextAppointment: {
                            _id: nextAppt.id,
                            patientName: nextAppt.actual_patient_name || userData.name || 'Unknown',
                            tokenNumber: nextAppt.token_number
                        }
                    });
                }
            } else if (currentAppointment.actual_start_time) {
                const consultDuration = Math.round(
                    (Date.now() - parseInt(currentAppointment.actual_start_time)) / (1000 * 60)
                );
                const doctor = await getDoctorById(docId);
                const avgTime = doctor?.average_consultation_time || 15;

                if (consultDuration < avgTime * 0.5 && pendingAppointments.length > 0) {
                    const nextAppt = pendingAppointments[0];
                    const userData = nextAppt.user_data || {};
                    suggestions.push({
                        type: 'pull-next',
                        message: 'Consultation is running short - Pull next patient',
                        nextAppointment: {
                            _id: nextAppt.id,
                            patientName: nextAppt.actual_patient_name || userData.name || 'Unknown',
                            tokenNumber: nextAppt.token_number
                        },
                        timeSaved: avgTime - consultDuration
                    });
                }
            }
        }

        const appointmentsWithPositions = pendingAppointments.map((apt, index) => ({
            ...apt,
            queuePosition: index + 1
        }));

        const followUpAppointments = appointmentsWithPositions.filter(apt => {
            return apt.queuePosition > 2;
        });

        if (followUpAppointments.length > 0 && appointmentsWithPositions.length > 0) {
            const firstPending = appointmentsWithPositions[0];
            if (firstPending.queuePosition > 1) {
                const userData = followUpAppointments[0].user_data || {};
                suggestions.push({
                    type: 'move-followup',
                    message: 'Move follow-up patient to fill gap',
                    appointment: {
                        _id: followUpAppointments[0].id,
                        patientName: followUpAppointments[0].actual_patient_name || userData.name || 'Unknown',
                        tokenNumber: followUpAppointments[0].token_number
                    },
                    suggestedPosition: 1
                });
            }
        }

        return suggestions;
    } catch (error) {
        console.error('Error getting smart suggestions:', error);
        return [];
    }
}
