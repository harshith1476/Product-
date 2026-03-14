
import pg from 'pg';

const { Client } = pg;

async function checkTables() {
    console.log('Checking tables in Localhost:5432...');
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'Javali786',
        database: 'postgres'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables found:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error('❌ Failed:', err.message);
    }
}

checkTables();
