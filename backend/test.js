import { pgPool, testConnection } from './config/postgresql.js';

async function checkUser() {
  await testConnection();
  const res = await pgPool.query('SELECT email, password, role FROM users WHERE email = $1', ['shaikjavedali19@gmail.com']);
  console.log('Query result:', res.rows);
  pgPool.end();
}

checkUser().catch(console.error);
