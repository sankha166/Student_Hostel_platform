import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/client.js';
import { getUserByEmail, hashPassword, signAccessToken, verifyPassword } from '../auth.js';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
const signupSchema = credentials.extend({ name: z.string().trim().min(2).max(100), role: z.enum(['student','owner']).default('student'), phone: z.string().trim().max(30).optional(), address: z.string().trim().max(300).optional() });

router.post('/register', async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const email = input.email.toLowerCase();
    if (await getUserByEmail(email)) return res.status(409).json({ success:false, error:{ code:'EMAIL_EXISTS', message:'An account with this email already exists.' } });
    const hash = await hashPassword(input.password);
    const result = await query('INSERT INTO users(email,password_hash,name,role,phone,address) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,name,role,phone,address', [email,hash,input.name,input.role,input.phone ?? null,input.address ?? null]);
    const user = result.rows[0] as any;
    const token = signAccessToken(user);
    return res.status(201).json({ success:true, data:{ user, token } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const result = await query('SELECT id,email,password_hash,name,role,phone,address,avatar_url FROM users WHERE email=$1 AND is_active=TRUE', [input.email.toLowerCase()]);
    const row = result.rows[0] as any;
    if (!row || !(await verifyPassword(input.password, row.password_hash))) return res.status(401).json({ success:false, error:{ code:'INVALID_CREDENTIALS', message:'Invalid email or password.' } });
    const { password_hash: _hash, ...user } = row;
    return res.json({ success:true, data:{ user, token: signAccessToken(user) } });
  } catch (e) { next(e); }
});

export default router;
