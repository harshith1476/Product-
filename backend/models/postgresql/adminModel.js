import { query } from '../../config/postgresql.js';

// ============================================
// ADMIN MODEL
// ============================================

export const getAdminByEmail = async (email) => {
    const sql = 'SELECT * FROM admins WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
};

export const createAdmin = async (email, password) => {
    const sql = 'INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING *';
    const result = await query(sql, [email, password]);
    return result.rows[0];
};

export const getDashboardStats = async () => {
    const usersCount = (await query('SELECT count(*) FROM users')).rows[0].count;
    const doctorsCount = (await query('SELECT count(*) FROM doctors')).rows[0].count;
    const appointmentsCount = (await query('SELECT count(*) FROM appointments')).rows[0].count;
    const hospitalsCount = (await query('SELECT count(*) FROM hospitals')).rows[0].count;

    return {
        users: parseInt(usersCount),
        doctors: parseInt(doctorsCount),
        appointments: parseInt(appointmentsCount),
        hospitals: parseInt(hospitalsCount)
    };
};
