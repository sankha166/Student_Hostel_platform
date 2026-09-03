import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "nexus-dev-secret-change-me";
const ACCESS_EXPIRY = "7d";

export interface JwtPayload {
  sub: string;
  accountId: string;
  email: string;
  role: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: Pick<User, "id" | "accountId" | "email" | "role">): string {
  const payload: JwtPayload = {
    sub: user.id,
    accountId: user.accountId,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// --- RBAC permission matrix (from the doc, section 8.3) ---
const PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner:    { properties: ["CRUD"], residents: ["CRUD"], beds: ["CRUD"], payments: ["Read"], complaints: ["Read"], reports: ["Full"], settings: ["Full"] },
  manager:  { properties: ["Read"], residents: ["CRUD"], beds: ["Update"], payments: ["CRUD"], complaints: ["CRUD"], reports: ["Read"], settings: ["Read"] },
  warden:    { properties: ["Read"], residents: ["CRUD"], beds: ["Update"], payments: ["Read"], complaints: ["CRUD"], reports: [], settings: [] },
  reception: { properties: ["Read"], residents: ["CRUD"], beds: ["Read"], payments: ["Create"], complaints: ["Create"], reports: [], settings: [] },
  finance:   { properties: ["Read"], residents: ["Read"], beds: ["Read"], payments: ["CRUD"], complaints: ["Read"], reports: ["Financial"], settings: [] },
  maintenance:{ properties: ["Read"], residents: ["Read"], beds: [], payments: [], complaints: ["Update"], reports: [], settings: [] },
  resident:  { properties: ["Own"], residents: ["Own"], beds: ["Own"], payments: ["Own"], complaints: ["Own"], reports: [], settings: [] },
};

export function can(role: string, resource: string, action: "Create" | "Read" | "Update" | "Delete" | "Full" | "Own"): boolean {
  const perms = PERMISSIONS[role]?.[resource] ?? [];
  if (perms.includes("Full") || perms.includes("Own")) return true;
  if (perms.includes("CRUD")) return ["Create", "Read", "Update", "Delete"].includes(action);
  return perms.includes(action);
}

// --- Express middleware ---
export interface AuthedRequest extends Request {
  user?: JwtPayload & { dbUser?: User };
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Helper: get the account-scoped where clause for queries
export function accountScope(req: AuthedRequest) {
  return { accountId: req.user!.accountId };
}
