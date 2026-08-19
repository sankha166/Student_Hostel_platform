import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;
// These are bootstrap-only defaults. Change ADMIN_EMAIL/ADMIN_PASSWORD before production.
const email = process.env.ADMIN_EMAIL || 'admin@studenthostel.local';
const password = process.env.ADMIN_PASSWORD || 'Admin@2026#StrongPassword';
const name = process.env.ADMIN_NAME || 'Platform Administrator';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
try {
  await pool.query('BEGIN');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(`INSERT INTO admin_users(email,password_hash,name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,is_active=true`, [email.toLowerCase().trim(), hash, name]);
  await pool.query(`INSERT INTO admin_permissions(admin_id) SELECT id FROM admin_users WHERE email=$1 ON CONFLICT(admin_id) DO NOTHING`, [email.toLowerCase().trim()]);
  await pool.query('COMMIT');
  console.log('Admin account ready:', email.toLowerCase().trim());
  console.log('Bootstrap password:', password);
} catch (error) {
  await pool.query('ROLLBACK');
  console.error('Admin bootstrap failed:', error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
