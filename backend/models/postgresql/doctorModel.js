import { query } from '../../config/postgresql.js';

// ============================================
// DOCTOR MODEL
// ============================================

export const getAllDoctors = async () => {
    const sql = 'SELECT * FROM doctors ORDER BY date DESC';
    const result = await query(sql);
    return result.rows;
};

export const getDoctorById = async (id) => {
    const sql = 'SELECT * FROM doctors WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getDoctorByEmail = async (email) => {
    const sql = 'SELECT * FROM doctors WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
};

export const getDoctorsBySpecialty = async (speciality) => {
    const sql = `
        SELECT * FROM doctors 
        WHERE speciality = $1 AND available = true
        ORDER BY name ASC
    `;
    const result = await query(sql, [speciality]);
    return result.rows;
};

export const createDoctor = async (doctorData) => {
    // Extract address fields safely
    const address = doctorData.address || {};
    const addressLine1 = address.line1 || '';
    const addressLine2 = address.line2 || '';

    const values = [
        doctorData.name, doctorData.email, doctorData.password, doctorData.image,
        doctorData.speciality, doctorData.degree, doctorData.experience,
        doctorData.about, doctorData.available, doctorData.fees,
        addressLine1, addressLine2, doctorData.date,
        doctorData.slots_booked || {}, doctorData.hospitalId || null,
        doctorData.videoConsult !== undefined ? doctorData.videoConsult : false
    ];

    const sql = `
        INSERT INTO doctors (
            name, email, password, image, speciality, degree, experience,
            about, available, fees, address_line1, address_line2, date, slots_booked, hospital_id, video_consult
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateDoctor = async (id, doctorData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (doctorData.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(doctorData.name); }
    if (doctorData.email !== undefined) { fields.push(`email = $${paramCount++}`); values.push(doctorData.email); }
    if (doctorData.password !== undefined) { fields.push(`password = $${paramCount++}`); values.push(doctorData.password); }
    if (doctorData.image !== undefined) { fields.push(`image = $${paramCount++}`); values.push(doctorData.image); }
    if (doctorData.speciality !== undefined) { fields.push(`speciality = $${paramCount++}`); values.push(doctorData.speciality); }
    if (doctorData.degree !== undefined) { fields.push(`degree = $${paramCount++}`); values.push(doctorData.degree); }
    if (doctorData.experience !== undefined) { fields.push(`experience = $${paramCount++}`); values.push(doctorData.experience); }
    if (doctorData.about !== undefined) { fields.push(`about = $${paramCount++}`); values.push(doctorData.about); }
    if (doctorData.available !== undefined) { fields.push(`available = $${paramCount++}`); values.push(doctorData.available); }
    if (doctorData.fees !== undefined) { fields.push(`fees = $${paramCount++}`); values.push(doctorData.fees); }

    // Handle address update
    if (doctorData.address !== undefined) {
        const address = doctorData.address || {};
        fields.push(`address_line1 = $${paramCount++}`);
        values.push(address.line1 || '');

        fields.push(`address_line2 = $${paramCount++}`);
        values.push(address.line2 || '');
    }

    if (doctorData.status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(doctorData.status); }
    if (doctorData.current_appointment_id !== undefined) { fields.push(`current_appointment_id = $${paramCount++}`); values.push(doctorData.current_appointment_id); }
    if (doctorData.hospitalId !== undefined) { fields.push(`hospital_id = $${paramCount++}`); values.push(doctorData.hospitalId); }
    if (doctorData.videoConsult !== undefined) { fields.push(`video_consult = $${paramCount++}`); values.push(doctorData.videoConsult); }
    if (doctorData.locationLat !== undefined) { fields.push(`location_lat = $${paramCount++}`); values.push(doctorData.locationLat); }
    if (doctorData.locationLng !== undefined) { fields.push(`location_lng = $${paramCount++}`); values.push(doctorData.locationLng); }
    if (doctorData.slots_booked !== undefined) { fields.push(`slots_booked = $${paramCount++}`); values.push(doctorData.slots_booked); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE doctors SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const updateDoctorPassword = async (id, password) => {
    const sql = 'UPDATE doctors SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [password, id]);
    return result.rows[0];
};

export const changeDoctorAvailability = async (id, available) => {
    const sql = 'UPDATE doctors SET available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [available, id]);
    return result.rows[0];
};

export const deleteDoctor = async (id) => {
    const sql = 'DELETE FROM doctors WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};
