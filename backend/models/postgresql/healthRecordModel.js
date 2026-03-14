import { query } from '../../config/postgresql.js';

// ============================================
// HEALTH RECORD MODEL
// ============================================

export const getHealthRecordsByUserId = async (userId) => {
    const sql = 'SELECT * FROM health_records WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const createHealthRecord = async (recordData) => {
    const filesJson = JSON.stringify(recordData.files || []);
    const tagsJson = JSON.stringify(recordData.tags || []);

    const sql = `
        INSERT INTO health_records (
            user_id, doctor_id, appointment_id, diagnosis, prescription, notes, 
            attachments, record_type, title, description, doctor_name, record_date,
            tags, is_important, uploaded_before_appointment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
    `;
    const values = [
        recordData.userId, recordData.docId, recordData.appointmentId || null,
        recordData.diagnosis || '', recordData.prescription || '', recordData.notes || '',
        filesJson, recordData.recordType || 'general', recordData.title || '',
        recordData.description || '', recordData.doctorName || '', recordData.date || new Date(),
        tagsJson, recordData.isImportant || false, recordData.uploadedBeforeAppointment || false
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const getHealthRecords = async (filters) => {
    let sql = 'SELECT * FROM health_records WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.userId) { sql += ` AND user_id = $${paramCount++}`; values.push(filters.userId); }
    if (filters.docId) { sql += ` AND doctor_id = $${paramCount++}`; values.push(filters.docId); }
    if (filters.appointmentId) { sql += ` AND appointment_id = $${paramCount++}`; values.push(filters.appointmentId); }
    if (filters.recordType) { sql += ` AND record_type = $${paramCount++}`; values.push(filters.recordType); }
    if (filters.startDate) { sql += ` AND record_date >= $${paramCount++}`; values.push(filters.startDate); }
    if (filters.endDate) { sql += ` AND record_date <= $${paramCount++}`; values.push(filters.endDate); }
    if (filters.search) {
        sql += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR doctor_name ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
        paramCount++;
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, values);
    return result.rows;
};

export const getHealthRecordById = async (id) => {
    const sql = 'SELECT * FROM health_records WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const deleteHealthRecord = async (id) => {
    const sql = 'DELETE FROM health_records WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const updateHealthRecord = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.viewedByDoctor !== undefined) { fields.push(`viewed_by_doctor = $${paramCount++}`); values.push(data.viewedByDoctor); }
    if (data.viewedAt) { fields.push(`viewed_at = $${paramCount++}`); values.push(data.viewedAt); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE health_records SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};
