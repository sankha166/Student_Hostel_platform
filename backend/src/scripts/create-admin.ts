import 'dotenv/config';
import { query, pool } from '../db/client.js';
import { hashPassword } from '../auth.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Platform Admin';

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running the admin bootstrap.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}
if (!pool) {
  console.error('DATABASE_URL is not configured.');
  process.exit(1);
}

try {
  const passwordHash = await hashPassword(password);
  const result = await query(`
    INSERT INTO users(email,password_hash,name,role,is_active)
    VALUES($1,$2,$3,'admin',TRUE)
    ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role='admin',is_active=TRUE,updated_at=NOW()
    RETURNING id,email,name,role
  `, [email, passwordHash, name]);
  console.log('Admin account ready:', result.rows[0]);
} finally {
  await pool.end();
}
