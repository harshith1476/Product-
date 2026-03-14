
import pg from 'pg';

const { Client } = pg;

async function testLocal() {
    console.log('Connecting to Localhost:5432...');
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully to Localhost!');
        const res = await client.query('SELECT NOW()');
        console.log('Query Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Failed Localhost:', err.message);
    }
}

testLocal();
