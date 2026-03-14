import { query, closePool } from './backend/config/postgresql.js';

async function listAllTables() {
    try {
        console.log('--- Listing All Tables ---');
        const sql = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        `;
        const result = await query(sql);
        console.log('Tables found:', result.rows.map(r => r.table_name).join(', '));

        for (const table of result.rows) {
            const countResult = await query(`SELECT COUNT(*) FROM ${table.table_name}`);
            console.log(`Table: ${table.table_name}, Count: ${countResult.rows[0].count}`);
        }

    } catch (error) {
        console.error('Database Error:', error.message);
    } finally {
        await closePool();
    }
}

listAllTables();
