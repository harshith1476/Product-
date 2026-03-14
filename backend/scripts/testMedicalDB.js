import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('DEBUG: Loaded env from:', envPath);
console.log('DEBUG: PG_USER:', process.env.PG_USER);

const testMedicalDB = async () => {
    try {
        console.log('🚀 Starting Medical DB Test...');

        // Dynamic import
        const { getComprehensiveMedicalInfo, searchMedicalKnowledge } = await import('../utils/medicalKnowledgeBase.js');
        const { closePool } = await import('../config/postgresql.js'); // need to close pool to exit

        // Test 1: Search for 'tonsillitis'
        console.log('\n--- Test 1: Search "tonsillitis" ---');
        const results = await searchMedicalKnowledge('tonsillitis');
        console.log(`Found ${results.length} matches.`);
        if (results.length > 0) {
            console.log('Sample Match:', results[0].keyword, '| Severity:', results[0].severity);
        }

        // Test 2: Get Comprehensive Info for 'headache' (might not exist in new dump) or 'tonsillitis'
        console.log('\n--- Test 2: Get Info for ["Tonsillitis in adults"] ---');
        const info = await getComprehensiveMedicalInfo(['Tonsillitis in adults'], 'I have a sore throat');
        console.log('Comprehensive Info Result:');
        console.log(JSON.stringify(info, null, 2));

        await closePool();
        console.log('\n✅ Test completed.');
    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
};

testMedicalDB();
