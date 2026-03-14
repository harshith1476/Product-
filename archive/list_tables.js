import { query, closePool } from './backend/config/postgresql.js';

async function listTables() {
    try {
        console.log('--- Tables ---');
        const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.table(tables.rows);
    } catch (err) {
        console.error('Error listing tables:', err);
    } finally {
        await closePool();
    }
}

listTables();
