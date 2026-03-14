import { query } from '../../config/postgresql.js';

// ============================================
// APPOINTMENT MODEL
// ============================================

export const getAllAppointments = async () => {
    const sql = 'SELECT * FROM appointments ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
};

export const getAppointmentById = async (id) => {
    const sql = 'SELECT * FROM appointments WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getAppointmentsByUserId = async (userId) => {
    const sql = 'SELECT * FROM appointments WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const getAppointmentsByDoctorId = async (doctorId) => {
    const sql = 'SELECT * FROM appointments WHERE doctor_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [doctorId]);
    return result.rows;
};

export const getAppointmentsByFilters = async (filters) => {
    const { docId, slotDate, cancelled, isCompleted, status } = filters;
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (docId) { sql += ` AND doctor_id = $${paramCount++}`; values.push(docId); }
    if (slotDate) { sql += ` AND slot_date = $${paramCount++}`; values.push(slotDate); }
    if (cancelled !== undefined) { sql += ` AND cancelled = $${paramCount++}`; values.push(cancelled); }
    if (isCompleted !== undefined) { sql += ` AND is_completed = $${paramCount++}`; values.push(isCompleted); }
    if (status) { sql += ` AND status = $${paramCount++}`; values.push(status); }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, values);
    return result.rows;
};

export const createAppointment = async (appointmentData) => {
    const sql = `
        INSERT INTO appointments (
            user_id, doctor_id, slot_date, slot_time, user_data, doctor_data,
            amount, consultation_fee, platform_fee, gst, cost_breakdown, date,
            payment_method, mode, actual_patient_name, actual_patient_age,
            actual_patient_gender, actual_patient_relationship, actual_patient_is_self,
            token_number, status, queue_position, estimated_wait_time, selected_symptoms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *
    `;
    const values = [
        appointmentData.userId, appointmentData.docId, appointmentData.slotDate, appointmentData.slotTime,
        JSON.stringify(appointmentData.userData || {}), JSON.stringify(appointmentData.docData || {}),
        appointmentData.amount, appointmentData.consultationFee || 0, appointmentData.platformFee || 0,
        appointmentData.gst || 0, JSON.stringify(appointmentData.costBreakdown || {}), Date.now(),
        appointmentData.paymentMethod || 'payOnVisit', appointmentData.mode || 'In-person',
        appointmentData.actualPatient?.name || '', appointmentData.actualPatient?.age || '',
        appointmentData.actualPatient?.gender || '', appointmentData.actualPatient?.relationship || '',
        appointmentData.actualPatient?.isSelf !== undefined ? appointmentData.actualPatient.isSelf : true,
        appointmentData.tokenNumber || 0, appointmentData.status || 'pending',
        appointmentData.queuePosition || 0, appointmentData.estimatedWaitTime || 0,
        Array.isArray(appointmentData.selectedSymptoms) ? appointmentData.selectedSymptoms : []
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateAppointment = async (id, appointmentData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const updatableFields = [
        'status', 'paymentStatus', 'payment', 'paymentMethod', 'cancelled', 'isCompleted',
        'transactionId', 'upiTransactionId', 'payerVpa', 'paymentTimestamp', 'alerted',
        'queuePosition', 'estimatedWaitTime', 'isDelayed', 'delayReason'
    ];

    updatableFields.forEach(f => {
        if (appointmentData[f] !== undefined) {
            // Map camelCase to snake_case for DB
            const dbField = f.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${dbField} = $${paramCount++}`);
            values.push(appointmentData[f]);
        }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const cancelAppointment = async (id) => {
    const sql = `UPDATE appointments SET cancelled = true, status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const deleteAppointment = async (id) => {
    const sql = 'DELETE FROM appointments WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};
