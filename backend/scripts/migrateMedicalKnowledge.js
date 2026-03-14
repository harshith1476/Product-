import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend/.env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('DEBUG: PG_USER:', process.env.PG_USER);

// Dynamic import to ensure env vars are loaded before postgresql.js initializes
const { query, closePool } = await import('../config/postgresql.js');

const JSON_FILE_PATH = path.join(__dirname, '../utils/test.medicalknowledges.json');

// Define the table schema - Updated to support flexible JSON data
const createTableQuery = `
    DROP TABLE IF EXISTS medical_knowledge CASCADE;
    CREATE TABLE medical_knowledge (
        id SERIAL PRIMARY KEY,
        keyword TEXT, -- changed to TEXT to avoid truncation errors
        category VARCHAR(50),
        severity VARCHAR(50),
        summary TEXT, -- description or fullText
        metadata JSONB, -- store complete original record
        conditions TEXT[], -- array of related condition names
        source VARCHAR(255) DEFAULT 'Medical Knowledge Base',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const migrateMedicalKnowledge = async () => {
    try {
        console.log('🚀 Starting migration from JSON file...');

        // 1. Create Table (Drop existing)
        await query(createTableQuery);
        console.log('✅ Table medical_knowledge created.');

        // 3. Read and Parse JSON
        if (!fs.existsSync(JSON_FILE_PATH)) {
            throw new Error(`JSON file not found at: ${JSON_FILE_PATH}`);
        }

        console.log('📖 Reading JSON file (this might take a moment)...');
        const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        const records = JSON.parse(rawData);
        console.log(`📊 Found ${records.length} records to migrate.`);

        // 4. Batch Insert Data
        const BATCH_SIZE = 50;
        let insertedCount = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (record) => {
                const sql = `
                    INSERT INTO medical_knowledge (
                        keyword, category, severity, summary, metadata, conditions, source
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;

                const keyword = record.symptom || record.condition || record.keyword || 'Unknown';
                // Ensure keyword is not excessively long for index later (2000 chars safe limit for usage)
                // But for table, TEXT is fine.

                const category = record.type || 'condition';
                const severity = record.severity || 'Low';
                const summary = record.description || record.fullText || '';
                const conditions = record.keywords || [keyword];

                const params = [
                    keyword,
                    category,
                    severity,
                    summary,
                    JSON.stringify(record),
                    conditions,
                    record.source || 'Medical Knowledge Base'
                ];

                try {
                    return await query(sql, params);
                } catch (err) {
                    console.error(`Error inserting record "${keyword}":`, err.message);
                    return null; // Continue despite error
                }
            });

            await Promise.all(promises);
            insertedCount += batch.length;
            if (insertedCount % 500 === 0) {
                process.stdout.write(`\r✅ Inserted ${insertedCount} / ${records.length} records...`);
            }
        }

        console.log('\n✅ Data migration completed.');

        // 5. Create Indexes Safely
        console.log('🔨 Creating indexes...');
        try {
            await query('CREATE INDEX idx_medical_knowledge_keyword ON medical_knowledge(substr(keyword, 1, 200))');
            await query('CREATE INDEX idx_medical_knowledge_category ON medical_knowledge(category)');
            console.log('✅ Indexes created successfully.');
        } catch (idxErr) {
            console.error('❌ Index creation warning:', idxErr.message);
        }

        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration critical failure:', error);
        try { if (closePool) await closePool(); } catch (e) { }
        process.exit(1);
    }
};

migrateMedicalKnowledge();
