import { query } from '../../config/postgresql.js';

// ============================================
// JOB APPLICATIONS
// ============================================

export const createJobApplication = async (data) => {
    const sql = `
        INSERT INTO job_applications (name, email, phone, position, resume_url, cover_letter, city, qualification, experience, skills)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;
    const values = [data.name, data.email, data.phone, data.position, data.resumeUrl, data.coverLetter, data.city, data.qualification, data.experience, data.skills];
    const result = await query(sql, values);
    return result.rows[0];
};

export const getAllJobApplications = async () => {
    const sql = 'SELECT * FROM job_applications ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
};

export const getJobApplicationById = async (id) => {
    const sql = 'SELECT * FROM job_applications WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const updateJobApplicationStatus = async (id, status) => {
    const sql = 'UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [status, id]);
    return result.rows[0];
};

export const deleteJobApplication = async (id) => {
    const sql = 'DELETE FROM job_applications WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const searchJobApplications = async (filters) => {
    let sql = 'SELECT * FROM job_applications WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.position) {
        sql += ` AND position ILIKE $${paramCount++}`;
        values.push(`%${filters.position}%`);
    }
    if (filters.status) {
        sql += ` AND status = $${paramCount++}`;
        values.push(filters.status);
    }
    if (filters.city) {
        sql += ` AND city ILIKE $${paramCount++}`;
        values.push(`%${filters.city}%`);
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, values);
    return result.rows;
};

// ============================================
// MEDICAL KNOWLEDGE
// ============================================

export const getMedicalKnowledgeBySymptom = async (symptom) => {
    const sql = 'SELECT * FROM medical_knowledge WHERE symptom ILIKE $1';
    const result = await query(sql, [`%${symptom}%`]);
    return result.rows;
};

// ============================================
// NOTIFICATIONS
// ============================================

export const createNotification = async (userId, title, message, type = 'general') => {
    const sql = `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await query(sql, [userId, title, message, type]);
    return result.rows[0];
};

export const getNotificationsByUserId = async (userId) => {
    const sql = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const markNotificationRead = async (id) => {
    const sql = 'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};
