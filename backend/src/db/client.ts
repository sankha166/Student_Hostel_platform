import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pool = env.DATABASE_URL
  ? new Pool({ connectionString: env.DATABASE_URL, max: 10, ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined })
  : null;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(text: string, params: unknown[] = []) {
  if (!pool) throw new Error('DATABASE_URL is not configured');
  return pool.query<T>(text, params);
}
