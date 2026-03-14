import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    port: parseInt(process.env.PG_PORT) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000, // 60 seconds
    ssl: process.env.PG_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

// Test connection
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Helper function to execute queries
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Helper function to get a client from the pool
export const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
        client.lastQuery = args;
        return query(...args);
    };

    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release();
    };

    return client;
};

// Test database connection
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ PostgreSQL connection test successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection test failed:', error.message);
        return false;
    }
};

// Close all connections
export const closePool = async () => {
    await pool.end();
    console.log('PostgreSQL pool closed');
};

export default pool;
