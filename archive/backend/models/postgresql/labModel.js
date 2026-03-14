import { query } from '../../config/postgresql.js';

export const getAllLabs = async () => {
    const sql = `SELECT * FROM labs ORDER BY created_at DESC`;
    const result = await query(sql);
    return result.rows;
};

export const getLabById = async (id) => {
    const sql = `SELECT * FROM labs WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const createLab = async (data) => {
    const sql = `
        INSERT INTO labs (name, location, city, latitude, longitude, rating, verified, services, open_now, partner_type, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;
    const values = [
        data.name, data.location, data.city, data.latitude, data.longitude,
        data.rating || 0, data.verified || false, JSON.stringify(data.services || []),
        data.openNow !== undefined ? data.openNow : true,
        data.partnerType || 'normal', data.image || null
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const updateLab = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            let value = data[key];
            if (key === 'services') value = JSON.stringify(value);
            
            // Map camelCase to snake_case for DB
            const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${dbKey} = $${paramCount++}`);
            values.push(value);
        }
    });

    if (fields.length === 0) return null;
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `UPDATE labs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(sql, values);
    return result.rows[0];
};

export const deleteLab = async (id) => {
    const sql = `DELETE FROM labs WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0];
};
