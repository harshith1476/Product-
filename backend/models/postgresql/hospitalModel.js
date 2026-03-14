import { query } from '../../config/postgresql.js';

// ============================================
// HOSPITAL MODEL (Login-able)
// ============================================

export const getAllHospitals = async () => {
    const sql = `SELECT * FROM hospitals WHERE available = true ORDER BY name ASC`;
    const result = await query(sql);
    return result.rows;
};

export const getHospitalById = async (id) => {
    const sql = 'SELECT * FROM hospitals WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getHospitalByEmail = async (email) => {
    const sql = 'SELECT * FROM hospitals WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
};

export const createHospital = async (hospitalData) => {
    const sql = `
        INSERT INTO hospitals (
            name, email, password, image, address_line1, address_line2,
            speciality, about, available, date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;
    const values = [
        hospitalData.name, hospitalData.email, hospitalData.password, hospitalData.image || null,
        hospitalData.address?.line1 || '', hospitalData.address?.line2 || '',
        hospitalData.speciality || [], hospitalData.about || '',
        hospitalData.available !== undefined ? hospitalData.available : true, Date.now()
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateHospital = async (id, hospitalData) => {
    const sql = `
        UPDATE hospitals SET
            name = COALESCE($1, name),
            image = COALESCE($2, image),
            address_line1 = COALESCE($3, address_line1),
            address_line2 = COALESCE($4, address_line2),
            speciality = COALESCE($5, speciality),
            about = COALESCE($6, about),
            available = COALESCE($7, available),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
    `;
    const values = [
        hospitalData.name, hospitalData.image, hospitalData.address?.line1,
        hospitalData.address?.line2, hospitalData.speciality, hospitalData.about, hospitalData.available, id
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteHospital = async (id) => {
    const sql = 'DELETE FROM hospitals WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

// ============================================
// HOSPITAL TIE-UP MODEL
// ============================================

export const getAllHospitalTieUps = async () => {
    const sql = 'SELECT * FROM hospital_tieups ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
};

export const getPublicHospitalTieUps = async () => {
    const sql = 'SELECT * FROM hospital_tieups WHERE show_on_home = true ORDER BY name ASC';
    const result = await query(sql);
    return result.rows;
};

export const getHospitalTieUpById = async (id) => {
    const sql = 'SELECT * FROM hospital_tieups WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const createHospitalTieUp = async (data) => {
    const sql = `
        INSERT INTO hospital_tieups (name, address, contact, specialization, type, show_on_home)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const values = [data.name, data.address, data.contact, data.specialization, data.type || 'General', data.showOnHome || false];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateHospitalTieUp = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(data.name); }
    if (data.address !== undefined) { fields.push(`address = $${paramCount++}`); values.push(data.address); }
    if (data.contact !== undefined) { fields.push(`contact = $${paramCount++}`); values.push(data.contact); }
    if (data.specialization !== undefined) { fields.push(`specialization = $${paramCount++}`); values.push(data.specialization); }
    if (data.type !== undefined) { fields.push(`type = $${paramCount++}`); values.push(data.type); }
    if (data.showOnHome !== undefined) { fields.push(`show_on_home = $${paramCount++}`); values.push(data.showOnHome); }

    if (fields.length === 0) return null;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE hospital_tieups SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteHospitalTieUp = async (id) => {
    const sql = 'DELETE FROM hospital_tieups WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

// Tie-up Doctors
export const getHospitalTieUpDoctors = async (hospitalId) => {
    const sql = 'SELECT * FROM hospital_tieup_doctors WHERE hospital_tieup_id = $1';
    const result = await query(sql, [hospitalId]);
    return result.rows;
};

export const addHospitalTieUpDoctor = async (hospitalId, data) => {
    const sql = `
        INSERT INTO hospital_tieup_doctors (
            hospital_tieup_id, name, qualification, specialization, experience, 
            image, available, show_on_hospital_page
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [
        hospitalId, data.name, data.qualification, data.specialization, data.experience,
        data.image || '', data.available !== undefined ? data.available : true,
        data.showOnHospitalPage !== undefined ? data.showOnHospitalPage : true
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateHospitalTieUpDoctor = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;
    if (data.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(data.name); }
    if (data.qualification !== undefined) { fields.push(`qualification = $${paramCount++}`); values.push(data.qualification); }
    if (data.specialization !== undefined) { fields.push(`specialization = $${paramCount++}`); values.push(data.specialization); }
    if (data.experience !== undefined) { fields.push(`experience = $${paramCount++}`); values.push(data.experience); }
    if (data.image !== undefined) { fields.push(`image = $${paramCount++}`); values.push(data.image); }
    if (data.available !== undefined) { fields.push(`available = $${paramCount++}`); values.push(data.available); }
    if (data.showOnHospitalPage !== undefined) { fields.push(`show_on_hospital_page = $${paramCount++}`); values.push(data.showOnHospitalPage); }
    if (fields.length === 0) return null;
    const sql = `UPDATE hospital_tieup_doctors SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteHospitalTieUpDoctor = async (id) => {
    const sql = 'DELETE FROM hospital_tieup_doctors WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getHospitalTieUpDoctorById = async (id) => {
    const sql = 'SELECT * FROM hospital_tieup_doctors WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};
