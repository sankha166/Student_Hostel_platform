import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from './config/env.js';
import { query } from './db/client.js';

export type Role = 'student' | 'owner' | 'admin';
export interface AuthUser { id: string; email: string; name: string; role: Role; }

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export function signAccessToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success:false, error:{ code:'UNAUTHORIZED', message:'Authentication required.' } });
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser & { sub: string };
    next();
  } catch {
    return res.status(401).json({ success:false, error:{ code:'INVALID_TOKEN', message:'Invalid or expired access token.' } });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success:false, error:{ code:'FORBIDDEN', message:'You do not have permission for this resource.' } });
    next();
  };
}

declare global { namespace Express { interface Request { user?: AuthUser & { sub: string } } } }

export async function getUserByEmail(email: string) {
  const result = await query('SELECT id, email, name, role, phone, address, avatar_url FROM users WHERE email = $1 AND is_active = TRUE', [email.toLowerCase()]);
  return result.rows[0] as (AuthUser & { phone?: string; address?: string; avatar_url?: string }) | undefined;
}
