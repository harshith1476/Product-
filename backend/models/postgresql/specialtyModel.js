import { query } from '../../config/postgresql.js';

// ============================================
// SPECIALTY MODEL
// ============================================

export const getAllSpecialties = async () => {
    const sql = 'SELECT * FROM specialties ORDER BY specialty_name ASC';
    const result = await query(sql);
    return result.rows;
};

export const getSpecialtyByName = async (name) => {
    const sql = 'SELECT * FROM specialties WHERE specialty_name ILIKE $1';
    const result = await query(sql, [`%${name}%`]);
    return result.rows[0];
};

export const getSpecialtyById = async (id) => {
    const sql = 'SELECT * FROM specialties WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const createSpecialty = async (specialtyData) => {
    const sql = `
        INSERT INTO specialties (specialty_name, helpline_number, availability, status, updated_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [
        specialtyData.specialtyName, specialtyData.helplineNumber,
        specialtyData.availability || '24x7', specialtyData.status || 'Active',
        specialtyData.updatedBy || null
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateSpecialty = async (id, specialtyData) => {
    const sql = `
        UPDATE specialties SET
            specialty_name = COALESCE($1, specialty_name),
            helpline_number = COALESCE($2, helpline_number),
            availability = COALESCE($3, availability),
            status = COALESCE($4, status),
            updated_by = COALESCE($5, updated_by),
            last_updated = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
    `;
    const values = [
        specialtyData.specialtyName, specialtyData.helplineNumber,
        specialtyData.availability, specialtyData.status, specialtyData.updatedBy, id
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteSpecialty = async (id) => {
    const sql = 'DELETE FROM specialties WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};
