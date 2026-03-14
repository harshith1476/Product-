import { pgPool, testConnection } from './config/postgresql.js';
import bcrypt from 'bcryptjs';

async function updatePassword() {
    await testConnection();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);

    await pgPool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'shaikjavedali19@gmail.com']);
    console.log('Password updated successfully with bcryptjs hash.');

    const res = await pgPool.query('SELECT password FROM users WHERE email = $1', ['shaikjavedali19@gmail.com']);
    console.log('New hash check:', bcrypt.compareSync('12345678', res.rows[0].password));

    pgPool.end();
}

updatePassword().catch(console.error);
