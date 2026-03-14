import { query } from '../../config/postgresql.js';

// ============================================
// CONSULTATION MODEL
// ============================================

export const getConsultationById = async (id) => {
    const sql = 'SELECT * FROM consultations WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getConsultationsByDoctorId = async (doctorId) => {
    const sql = 'SELECT * FROM consultations WHERE doctor_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [doctorId]);
    return result.rows;
};

export const getConsultationsByUserId = async (userId) => {
    const sql = 'SELECT * FROM consultations WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const createConsultation = async (data) => {
    const sql = `
        INSERT INTO consultations (appointment_id, user_id, doctor_id, status, type, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const values = [data.appointmentId, data.userId, data.doctorId, data.status || 'ongoing', data.type || 'video', data.notes || ''];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateConsultation = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(data.status); }
    if (data.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(data.notes); }
    if (data.endTime !== undefined) { fields.push(`end_time = $${paramCount++}`); values.push(data.endTime); }

    if (fields.length === 0) return null;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE consultations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    const result = await query(sql, values);
    return result.rows[0];
};

export const getVideoConsultDoctorsQuery = async () => {
    const sql = `SELECT * FROM doctors WHERE video_consult = true AND available = true`;
    const result = await query(sql);
    return result.rows;
};
