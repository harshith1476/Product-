import { query } from '../../config/postgresql.js';

export const createLabBooking = async (bookingData) => {
    const sql = `
        INSERT INTO lab_bookings (
            user_id, lab_name, full_name, test_name, dob, phone, email, preferred_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const values = [
        bookingData.userId,
        bookingData.labName,
        bookingData.fullName,
        bookingData.testName,
        bookingData.dob,
        bookingData.phone,
        bookingData.email,
        bookingData.preferredDate,
        bookingData.notes
    ];
    const result = await query(sql, values);
    return result.rows[0];
};

export const getLabBookingsByUserId = async (userId) => {
    const sql = 'SELECT * FROM lab_bookings WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [userId]);
    return result.rows;
};

export const cancelLabBooking = async (id) => {
    const sql = "UPDATE lab_bookings SET cancelled = true, status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    return result.rows[0];
};
