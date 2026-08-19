import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 8080);
const jwtSecret = process.env.JWT_SECRET;

if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured');
if (!jwtSecret) console.warn('JWT_SECRET is not configured');

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }) : null;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(v => v.trim()) : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const dbRequired = (req, res, next) => {
  if (!pool) return res.status(503).json({ message: 'Database is not configured' });
  next();
};

function signUser(user) {
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d' });
}

const auth = asyncRoute(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(header.slice(7), jwtSecret);
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
});

app.get('/health', asyncRoute(async (req, res) => {
  let database = 'not-configured';
  if (pool) { await pool.query('SELECT 1'); database = 'ok'; }
  res.json({ ok: true, service: 'residential-nexus-api', database, time: new Date().toISOString() });
}));

app.post('/api/auth/signup', dbRequired, asyncRoute(async (req, res) => {
  const { email, password, name, role, phone, address } = req.body || {};
  if (!email || !password || !name || !['student', 'owner'].includes(role)) return res.status(400).json({ message: 'email, password, name and role are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query('INSERT INTO users(email,password_hash,name,role,phone,address) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,name,role,phone,address,avatar_url,created_at', [normalizedEmail, passwordHash, String(name).trim(), role, phone || null, address || null]);
    const user = rows[0];
    res.status(201).json({ user, token: signUser(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'An account with this email already exists' });
    throw err;
  }
}));

app.post('/api/auth/login', dbRequired, asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query('SELECT id,email,name,role,phone,address,avatar_url,created_at,password_hash FROM users WHERE email=$1', [String(email || '').trim().toLowerCase()]);
  if (!rows[0] || !(await bcrypt.compare(password || '', rows[0].password_hash))) return res.status(401).json({ message: 'Invalid email or password' });
  const { password_hash, ...user } = rows[0];
  res.json({ user, token: signUser(user) });
}));

app.get('/api/auth/me', dbRequired, auth, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT id,email,name,role,phone,address,avatar_url,created_at FROM users WHERE id=$1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  res.json({ user: rows[0] });
}));

app.get('/api/hostels', dbRequired, asyncRoute(async (req, res) => {
  const { q = '', city = '', maxPrice = '' } = req.query;
  const values = [];
  const where = [];
  if (q) { values.push(`%${q}%`); where.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.address ILIKE $${values.length})`); }
  if (city) { values.push(`%${city}%`); where.push(`p.city ILIKE $${values.length}`); }
  if (maxPrice) { values.push(Number(maxPrice)); where.push(`EXISTS (SELECT 1 FROM rooms rx WHERE rx.property_id=p.id AND rx.monthly_rent <= $${values.length})`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT p.id,p.name,p.description,p.address,p.city,p.state,p.pincode,p.gender_policy,p.amenities,p.images,COALESCE(MIN(r.monthly_rent),0) AS price,COALESCE(SUM(r.capacity-r.occupied),0)::int AS available_beds FROM properties p LEFT JOIN rooms r ON r.property_id=p.id ${clause} GROUP BY p.id ORDER BY p.created_at DESC`, values);
  res.json({ results: rows });
}));

app.get('/api/hostels/:id', dbRequired, asyncRoute(async (req, res) => {
  const property = await pool.query('SELECT p.* FROM properties p WHERE p.id=$1', [req.params.id]);
  if (!property.rows[0]) return res.status(404).json({ message: 'Property not found' });
  const rooms = await pool.query('SELECT * FROM rooms WHERE property_id=$1 ORDER BY room_number', [req.params.id]);
  res.json({ property: property.rows[0], rooms: rooms.rows });
}));

app.get('/api/owner/properties', dbRequired, auth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner access required' });
  const { rows } = await pool.query('SELECT * FROM properties WHERE owner_id=$1 ORDER BY created_at DESC', [req.user.sub]);
  res.json({ results: rows });
}));

app.post('/api/owner/properties', dbRequired, auth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner access required' });
  const { name, description, address, city, state, pincode, latitude, longitude, genderPolicy, amenities = [], images = [] } = req.body || {};
  if (!name || !address || !city) return res.status(400).json({ message: 'name, address and city are required' });
  const { rows } = await pool.query('INSERT INTO properties(owner_id,name,description,address,city,state,pincode,latitude,longitude,gender_policy,amenities,images) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *', [req.user.sub,name,description||null,address,city,state||null,pincode||null,latitude||null,longitude||null,genderPolicy||null,JSON.stringify(amenities),JSON.stringify(images)]);
  res.status(201).json({ property: rows[0] });
}));

app.get('/api/bookings', dbRequired, auth, asyncRoute(async (req, res) => {
  const query = req.user.role === 'owner'
    ? 'SELECT b.*,u.name AS student_name,u.email AS student_email,p.name AS property_name,r.room_number FROM bookings b JOIN users u ON u.id=b.student_id JOIN properties p ON p.id=b.property_id LEFT JOIN rooms r ON r.id=b.room_id WHERE p.owner_id=$1 ORDER BY b.created_at DESC'
    : 'SELECT b.*,p.name AS property_name,r.room_number FROM bookings b JOIN properties p ON p.id=b.property_id LEFT JOIN rooms r ON r.id=b.room_id WHERE b.student_id=$1 ORDER BY b.created_at DESC';
  const { rows } = await pool.query(query, [req.user.sub]);
  res.json({ results: rows });
}));

app.post('/api/bookings', dbRequired, auth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access required' });
  const { propertyId, roomId, visitAt, message } = req.body || {};
  if (!propertyId) return res.status(400).json({ message: 'propertyId is required' });
  const { rows } = await pool.query('INSERT INTO bookings(student_id,property_id,room_id,visit_at,message) VALUES($1,$2,$3,$4,$5) RETURNING *', [req.user.sub,propertyId,roomId||null,visitAt||null,message||null]);
  res.status(201).json({ booking: rows[0] });
}));

app.patch('/api/bookings/:id', dbRequired, auth, asyncRoute(async (req, res) => {
  const { status, roomId } = req.body || {};
  if (!['accepted','rejected','cancelled','completed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const check = await pool.query('SELECT b.id,p.owner_id,b.student_id FROM bookings b JOIN properties p ON p.id=b.property_id WHERE b.id=$1', [req.params.id]);
  if (!check.rows[0]) return res.status(404).json({ message: 'Booking not found' });
  const row = check.rows[0];
  if (req.user.role === 'owner' && row.owner_id !== req.user.sub) return res.status(403).json({ message: 'Not your booking' });
  if (req.user.role === 'student' && row.student_id !== req.user.sub) return res.status(403).json({ message: 'Not your booking' });
  const { rows } = await pool.query('UPDATE bookings SET status=$1,room_id=COALESCE($2,room_id),updated_at=now() WHERE id=$3 RETURNING *', [status,roomId||null,req.params.id]);
  res.json({ booking: rows[0] });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

app.listen(port, () => console.log(`Residential Nexus API listening on :${port}`));
