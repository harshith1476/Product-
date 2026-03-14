import 'dotenv/config'
import { query } from './config/postgresql.js'

async function check() {
    try {
        const result = await query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'actual_patient_symptoms'
        `)
        console.log('Column definition:', result.rows[0])
    } catch (e) {
        console.error('Error:', e)
    }
}

check()
