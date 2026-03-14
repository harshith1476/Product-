import { v2 as cloudinary } from 'cloudinary';
import { query, closePool } from './config/postgresql.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const doctorsListDir = '../frontend/src/assets/Doctors_list';

const mapping = [
    { hospital: 'Andhra Hospitals', file: 'Dr_Sai_sandeep.png', name: 'Dr. K. Sai Sandeep' },
    { hospital: 'Andhra Hospitals', file: 'Dr_p_padma.jpg', name: 'Dr. P. Padma' },
    { hospital: 'Andhra Hospitals', file: 'Dr_venkata_ramana.png', name: 'Dr. P. Venkata Ramana Murthy' },
    { hospital: 'Apollo Hospitals', file: 'DR_krishna_mohan.png', name: 'Dr. B. Krishna Mohan' },
    { hospital: 'Apollo Hospitals', file: 'Dr_praveen_kumar.png', name: 'Dr. M. Praveen Kumar' },
    { hospital: 'Apollo Hospitals', file: 'dr_s_anitha.png', name: 'Dr. S. Anitha' },
    { hospital: 'Aster Ramesh Hospitals', file: 'Dr_Ramesh_Babu.png', name: 'Dr. Ramesh Babu' },
    { hospital: 'Aster Ramesh Hospitals', file: 'Dr_lakshmi_narayana.png', name: 'Dr. P. Lakshmi Narayana' },
    { hospital: 'Aster Ramesh Hospitals', file: 'Dr_sridevi.png', name: 'Dr. K. Sridevi' },
    { hospital: 'Capital Hospitals', file: 'Dr-Suresh_kumar.jpg', name: 'Dr. V. Suresh Kumar' },
    { hospital: 'Capital Hospitals', file: 'Dr_haritha.jpg', name: 'Dr. R. Haritha' },
    { hospital: 'Capital Hospitals', file: 'Dr_ravi_teja.jpg', name: 'Dr. N. Ravi Teja' },
    { hospital: 'Sai Hospitals', file: 'Dr_bhavani_devi.jpg', name: 'Dr. K. Bhavani Devi' },
    { hospital: 'Sai Hospitals', file: 'Dr_sandeep_kumar.jpg', name: 'Dr. P. Sandeep Kumar' },
    { hospital: 'Sai Hospitals', file: 'Dr_srinivasarao.jpg', name: 'Dr. M. Srinivas Rao' }
];

async function updateImages() {
    try {
        console.log('🚀 Starting Doctor Image Upload to Cloudinary...');

        for (const item of mapping) {
            const filePath = path.join(doctorsListDir, item.hospital, item.file);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                continue;
            }

            console.log(`📤 Uploading image for ${item.name} from ${filePath}...`);
            
            try {
                const uploadResult = await cloudinary.uploader.upload(filePath, {
                    folder: 'doctors',
                    public_id: item.name.replace(/\./g, '').replace(/ /g, '_').toLowerCase()
                });

                const imageUrl = uploadResult.secure_url;
                console.log(`✅ Uploaded! URL: ${imageUrl}`);

                // Update PostgreSQL
                const res = await query('UPDATE doctors SET image = $1 WHERE name = $2', [imageUrl, item.name]);
                if (res.rowCount > 0) {
                    console.log(`💎 Updated database for ${item.name}`);
                } else {
                    // Try partial match if full match fails
                    const partialRes = await query('UPDATE doctors SET image = $1 WHERE name LIKE $2', [imageUrl, `%${item.name}%`]);
                    if (partialRes.rowCount > 0) {
                        console.log(`💎 Updated database for ${item.name} (partial match)`);
                    } else {
                        console.warn(`🛑 Could not find doctor ${item.name} in database.`);
                    }
                }
            } catch (uploadErr) {
                console.error(`❌ Failed to upload/update ${item.name}:`, uploadErr.message);
            }
        }

        console.log('🏁 Batch update completed.');
        await closePool();
        process.exit(0);
    } catch (err) {
        console.error('💥 Critical error:', err);
        process.exit(1);
    }
}

updateImages();
