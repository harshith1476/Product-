import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'healthsystem_pg',
    password: 'Javali786',
    port: 5432,
});

async function migrate() {
    try {
        console.log('--- Starting Full Schema Sync for Appointments Table ---');
        
        const queries = [
            // Queue & Token Management
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS token_number INTEGER",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS queue_position INTEGER",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER DEFAULT 0",
            
            // Timing & Duration
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_start_time BIGINT",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_end_time BIGINT",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_duration INTEGER",
            
            // Scheduling Metadata
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN DEFAULT false",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS delay_reason TEXT DEFAULT ''",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS alerted BOOLEAN DEFAULT false",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recent_prescription TEXT",
            
            // Payment Detail Extensions (if missing)
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS upi_transaction_id VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payer_vpa VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMP"
        ];

        for (const q of queries) {
            console.log(`Executing: ${q}`);
            try {
                await pool.query(q);
            } catch (e) {
                console.log(`Note: Query failed (might already exist): ${e.message}`);
            }
        }

        console.log('✅ Full schema sync completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
