import { query } from '../../config/postgresql.js';

// ============================================
// USER MODEL
// ============================================

export const getAllUsers = async () => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
};

export const getUserById = async (id) => {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getUserByEmail = async (email) => {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
};

export const createUser = async (userData) => {
    const sql = `
        INSERT INTO users (
            name, email, password, image, phone, address_line1, address_line2,
            gender, dob, age, blood_group, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
    `;
    const values = [
        userData.name,
        userData.email,
        userData.password,
        userData.image || null,
        userData.phone || '000000000',
        userData.address?.line1 || '',
        userData.address?.line2 || '',
        userData.gender || 'Not Selected',
        userData.dob || 'Not Selected',
        userData.age || null,
        userData.bloodGroup || '',
        userData.role || 'patient'
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateUser = async (id, userData) => {
    const addrLine1 = userData.address?.line1 !== undefined ? userData.address.line1 : undefined;
    const addrLine2 = userData.address?.line2 !== undefined ? userData.address.line2 : undefined;

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(userData.name); }
    if (userData.phone !== undefined) { fields.push(`phone = $${paramCount++}`); values.push(userData.phone); }
    if (addrLine1 !== undefined) { fields.push(`address_line1 = $${paramCount++}`); values.push(addrLine1); }
    if (addrLine2 !== undefined) { fields.push(`address_line2 = $${paramCount++}`); values.push(addrLine2); }
    if (userData.gender !== undefined) { fields.push(`gender = $${paramCount++}`); values.push(userData.gender); }
    if (userData.dob !== undefined) { fields.push(`dob = $${paramCount++}`); values.push(userData.dob); }
    if (userData.age !== undefined) {
        fields.push(`age = $${paramCount++}`);
        values.push(userData.age === null || isNaN(userData.age) ? null : parseInt(userData.age));
    }
    if (userData.bloodGroup !== undefined) { fields.push(`blood_group = $${paramCount++}`); values.push(userData.bloodGroup); }
    if (userData.image !== undefined) { fields.push(`image = $${paramCount++}`); values.push(userData.image); }

    if (userData.savedProfiles !== undefined) { fields.push(`saved_profiles = $${paramCount++}`); values.push(JSON.stringify(userData.savedProfiles)); }
    if (userData.emergencyContacts !== undefined) { fields.push(`emergency_contacts = $${paramCount++}`); values.push(JSON.stringify(userData.emergencyContacts)); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const updateUserPassword = async (id, password) => {
    const sql = 'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [password, id]);
    return result.rows[0];
};

export const setResetPasswordOTP = async (email, otp, expiry) => {
    const sql = `
        UPDATE users 
        SET reset_password_otp = $1, reset_password_otp_expiry = $2, updated_at = CURRENT_TIMESTAMP
        WHERE email = $3
        RETURNING *
    `;
    const result = await query(sql, [otp, expiry, email]);
    return result.rows[0];
};

// Emergency Contacts (Legacy or Helper)
export const getEmergencyContacts = async (userId) => {
    const sql = 'SELECT * FROM emergency_contacts WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const addEmergencyContact = async (userId, contactData) => {
    const sql = `
        INSERT INTO emergency_contacts (user_id, name, phone, relation, contact_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [userId, contactData.name, contactData.phone, contactData.relation, contactData.contact_type];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateEmergencyContact = async (id, contactData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;
    if (contactData.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(contactData.name); }
    if (contactData.phone !== undefined) { fields.push(`phone = $${paramCount++}`); values.push(contactData.phone); }
    if (contactData.relation !== undefined) { fields.push(`relation = $${paramCount++}`); values.push(contactData.relation); }
    if (contactData.contact_type !== undefined) { fields.push(`contact_type = $${paramCount++}`); values.push(contactData.contact_type); }
    if (fields.length === 0) return null;
    const sql = `UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteEmergencyContact = async (id) => {
    const sql = 'DELETE FROM emergency_contacts WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

// Saved Profiles
export const getSavedProfiles = async (userId) => {
    const sql = 'SELECT * FROM saved_profiles WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const addSavedProfile = async (userId, profileData) => {
    const sql = `
        INSERT INTO saved_profiles (user_id, name, age, gender, relationship, phone, medical_history)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [
        userId, profileData.name, profileData.age, profileData.gender,
        profileData.relationship, profileData.phone || '', profileData.medicalHistory || []
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteSavedProfile = async (id) => {
    const sql = 'DELETE FROM saved_profiles WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};
