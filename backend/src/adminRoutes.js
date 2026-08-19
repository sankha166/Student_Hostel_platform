import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
const router = express.Router();
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }) : null;
const secret = process.env.JWT_SECRET;
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const requireAdmin = wrap(async (req, res, next) => {
  if (!pool || !secret) return res.status(503).json({ message: 'Admin service is not configured' });
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(header.slice(7), secret);
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Administrator access required' });
    const { rows } = await pool.query('SELECT id,email,name,role,is_active FROM admin_users WHERE id=$1', [payload.sub]);
    if (!rows[0] || !rows[0].is_active) return res.status(403).json({ message: 'Administrator account is disabled' });
    req.admin = rows[0];
    next();
  } catch { return res.status(401).json({ message: 'Invalid or expired administrator session' }); }
});

router.post('/login', wrap(async (req, res) => {
  if (!pool || !secret) return res.status(503).json({ message: 'Admin service is not configured' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const { rows } = await pool.query('SELECT * FROM admin_users WHERE email=$1', [email]);
  if (!rows[0] || !rows[0].is_active || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ message: 'Invalid administrator credentials' });
  const admin = rows[0];
  const token = jwt.sign({ sub: admin.id, role: 'admin', email: admin.email }, secret, { expiresIn: '8h' });
  await pool.query('UPDATE admin_users SET last_login_at=now() WHERE id=$1', [admin.id]);
  res.json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin' } });
}));

router.get('/me', requireAdmin, (req, res) => res.json({ user: req.admin }));

router.get('/overview', requireAdmin, wrap(async (req, res) => {
  const [users, owners, students, properties, bookings, payments, revenue, recent] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active=true"),
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role='owner' AND is_active=true"),
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role='student' AND is_active=true"),
    pool.query("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE verification_status='pending')::int AS pending FROM properties"),
    pool.query("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status='pending')::int AS pending FROM bookings"),
    pool.query("SELECT COUNT(*)::int AS count FROM payments"),
    pool.query("SELECT COALESCE(SUM(amount) FILTER (WHERE status='paid'),0)::numeric AS total FROM payments"),
    pool.query("SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 8")
  ]);
  res.json({ metrics: { users: users.rows[0].count, owners: owners.rows[0].count, students: students.rows[0].count, properties: properties.rows[0].count, pendingProperties: properties.rows[0].pending, bookings: bookings.rows[0].count, pendingBookings: bookings.rows[0].pending, payments: payments.rows[0].count, revenue: Number(revenue.rows[0].total) }, recentUsers: recent.rows });
}));

router.get('/analytics', requireAdmin, wrap(async (req, res) => {
  const [users, bookings, payments, cities] = await Promise.all([
    pool.query("SELECT to_char(date_trunc('month',created_at),'Mon YYYY') label, COUNT(*)::int value FROM users WHERE created_at >= now()-interval '12 months' GROUP BY 1, date_trunc('month',created_at) ORDER BY date_trunc('month',created_at)"),
    pool.query("SELECT status label, COUNT(*)::int value FROM bookings GROUP BY status ORDER BY value DESC"),
    pool.query("SELECT status label, COUNT(*)::int value, COALESCE(SUM(amount),0)::numeric total FROM payments GROUP BY status ORDER BY value DESC"),
    pool.query("SELECT city label, COUNT(*)::int value FROM properties GROUP BY city ORDER BY value DESC LIMIT 10")
  ]);
  res.json({ usersByMonth: users.rows, bookingsByStatus: bookings.rows, paymentsByStatus: payments.rows, propertiesByCity: cities.rows });
}));

router.get('/users', requireAdmin, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const role = String(req.query.role || '').trim();
  const values = []; const where = [];
  if (q) { values.push(`%${q}%`); where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`); }
  if (['student','owner'].includes(role)) { values.push(role); where.push(`role=$${values.length}`); }
  const { rows } = await pool.query(`SELECT id,name,email,role,phone,address,is_active,created_at FROM users ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 200`, values);
  res.json({ results: rows });
}));

router.patch('/users/:id', requireAdmin, wrap(async (req, res) => {
  if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be boolean' });
  const { rows } = await pool.query('UPDATE users SET is_active=$1,updated_at=now() WHERE id=$2 RETURNING id,name,email,role,is_active', [req.body.isActive, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)', [req.admin.id, req.body.isActive ? 'user.enabled' : 'user.disabled', 'user', req.params.id, JSON.stringify({ email: rows[0].email })]);
  res.json({ user: rows[0] });
}));

router.get('/properties', requireAdmin, wrap(async (req, res) => {
  const status = String(req.query.status || '').trim();
  const values = []; let clause = '';
  if (['pending','approved','rejected','suspended'].includes(status)) { values.push(status); clause = 'WHERE p.verification_status=$1'; }
  const { rows } = await pool.query(`SELECT p.id,p.name,p.city,p.state,p.address,p.verification_status,p.created_at,u.name owner_name,u.email owner_email,COALESCE(SUM(r.capacity),0)::int beds,COALESCE(SUM(r.occupied),0)::int occupied FROM properties p JOIN users u ON u.id=p.owner_id LEFT JOIN rooms r ON r.property_id=p.id ${clause} GROUP BY p.id,u.name,u.email ORDER BY p.created_at DESC LIMIT 200`, values);
  res.json({ results: rows });
}));

router.patch('/properties/:id', requireAdmin, wrap(async (req, res) => {
  const status = String(req.body?.status || '');
  if (!['approved','rejected','suspended','pending'].includes(status)) return res.status(400).json({ message: 'Invalid verification status' });
  const { rows } = await pool.query('UPDATE properties SET verification_status=$1,updated_at=now() WHERE id=$2 RETURNING id,name,verification_status', [status, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Property not found' });
  await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)', [req.admin.id, 'property.'+status, 'property', req.params.id, JSON.stringify({ name: rows[0].name })]);
  res.json({ property: rows[0] });
}));

router.get('/bookings', requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query("SELECT b.id,b.status,b.visit_at,b.created_at,s.name student_name,s.email student_email,p.name property_name,o.name owner_name FROM bookings b JOIN users s ON s.id=b.student_id JOIN properties p ON p.id=b.property_id JOIN users o ON o.id=p.owner_id ORDER BY b.created_at DESC LIMIT 300");
  res.json({ results: rows });
}));

router.get('/payments', requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query("SELECT py.*,u.name student_name,u.email student_email,p.name property_name FROM payments py JOIN users u ON u.id=py.student_id LEFT JOIN properties p ON p.id=py.property_id ORDER BY py.created_at DESC LIMIT 300");
  res.json({ results: rows });
}));

router.get('/audit-logs', requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query("SELECT a.*,ad.email admin_email FROM audit_logs a JOIN admin_users ad ON ad.id=a.admin_id ORDER BY a.created_at DESC LIMIT 300");
  res.json({ results: rows });
}));

export default router;
