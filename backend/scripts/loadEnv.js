import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('Environment variables loaded from:', path.join(__dirname, '../.env'));
console.log('PG_USER:', process.env.PG_USER);
console.log('PG_DATABASE:', process.env.PG_DATABASE);
