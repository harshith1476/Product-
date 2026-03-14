import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { query } from '../config/postgresql.js';

/**
 * DATA EXPORTER UTILITY
 * Allows exporting any PostgreSQL table to Excel or JSON
 */

export const exportTableToExcel = async (tableName, outputPath) => {
    try {
        const result = await query(`SELECT * FROM ${tableName}`);
        const data = result.rows;

        if (data.length === 0) {
            console.log(`⚠️ No data found in ${tableName} for export.`);
            return false;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        fs.writeFileSync(outputPath, buf);

        console.log(`✅ Table [${tableName}] exported to: ${outputPath}`);
        return true;
    } catch (err) {
        console.error(`❌ Export failed for ${tableName}:`, err.message);
        return false;
    }
};

export const exportAllToExcel = async (baseDir) => {
    const tables = [
        'users', 'doctors', 'hospitals', 'appointments',
        'hospital_tieups', 'health_records', 'specialties',
        'job_applications', 'medical_knowledge'
    ];

    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    for (const table of tables) {
        const fileName = `${table}_export_${Date.now()}.xlsx`;
        await exportTableToExcel(table, path.join(baseDir, fileName));
    }
};
