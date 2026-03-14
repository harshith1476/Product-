import { query } from '../../config/postgresql.js';

// ============================================
// MEDICAL KNOWLEDGE MODEL
// ============================================

/**
 * Search medical knowledge by keyword
 * @param {string} term - Search term
 * @returns {Promise<Array>} - List of matching records
 */
export const searchMedicalKnowledgeDB = async (term) => {
    const sql = `
        SELECT * FROM medical_knowledge 
        WHERE 
            keyword ILIKE $1 OR 
            $1 ILIKE ANY(conditions) OR
            source ILIKE $1
    `;
    const result = await query(sql, [`%${term}%`]);
    return result.rows;
};

/**
 * Get medical knowledge by exact keyword/symptom
 * @param {string} keyword - Exact symptom name
 * @returns {Promise<Object|null>} - Matching record or null
 */
export const getMedicalKnowledgeByKeyword = async (keyword) => {
    const sql = 'SELECT * FROM medical_knowledge WHERE keyword ILIKE $1';
    const result = await query(sql, [keyword]);
    return result.rows[0];
};

/**
 * Get emergency records matching a query
 * @param {string} queryText - User query text
 * @returns {Promise<Array>} - Matching emergency records
 */
export const getEmergencyRecords = async (queryText) => {
    // Find emergencies where the keyword is in the query text
    const sql = `
        SELECT * FROM medical_knowledge 
        WHERE category = 'emergency' AND $1 ILIKE ('%' || keyword || '%')
    `;
    const result = await query(sql, [queryText]);
    return result.rows;
};

/**
 * Add a new medical knowledge record (Internal/Admin use)
 * @param {Object} data - Medical record data
 */
export const addMedicalRecord = async (data) => {
    const sql = `
        INSERT INTO medical_knowledge (
            keyword, category, severity, conditions, otc_medicines, 
            precautions, when_to_see_doctor, immediate_action, do_not, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;
    const values = [
        data.keyword,
        data.category || 'symptom',
        data.severity || 'Low',
        data.conditions || [],
        data.otc_medicines || [],
        data.precautions || [],
        data.when_to_see_doctor || null,
        data.immediate_action || null,
        data.do_not || [],
        data.source || 'Medical Knowledge Base'
    ];
    const result = await query(sql, values);
    return result.rows[0];
};
