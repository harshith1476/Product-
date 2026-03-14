import { query } from '../../config/postgresql.js';

export const getAllBloodBanks = async () => {
    const sql = `SELECT * FROM blood_banks ORDER BY created_at DESC`;
    const result = await query(sql);
    return result.rows;
};

export const getBloodBankById = async (id) => {
    const sql = `SELECT * FROM blood_banks WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const createBloodBank = async (data) => {
    const sql = `
        INSERT INTO blood_banks (name, location, city, latitude, longitude, partner_type, available_blood, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [
        data.name, data.location, data.city, data.latitude, data.longitude,
        data.partnerType || 'normal', JSON.stringify(data.availableBlood || {}), data.image || null
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateBloodBank = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            let value = data[key];
            if (key === 'availableBlood') value = JSON.stringify(value);
            
            const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${dbKey} = $${paramCount++}`);
            values.push(value);
        }
    });

    if (fields.length === 0) return null;
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE blood_banks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteBloodBank = async (id) => {
    const sql = `DELETE FROM blood_banks WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0];
};
