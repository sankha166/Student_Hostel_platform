import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken, authMiddleware, type AuthedRequest } from "../lib/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: AuthedRequest, res) => {
  try {
    const { email, password, name, role, phone } = req.body as {
      email: string; password: string; name: string; role: "owner" | "resident"; phone?: string;
    };

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["owner", "resident"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ") || undefined;
    const normalizedEmail = email.toLowerCase().trim();

    // For an owner: create an account + user
    if (role === "owner") {
      const slug = normalizedEmail.split("@")[0] + "-" + Math.random().toString(36).slice(2, 6);
      const account = await prisma.account.create({
        data: {
          name: name.trim(),
          slug,
          email: normalizedEmail,
          phone,
          plan: "trial",
          status: "active",
        },
      });
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { accountId: account.id, email: normalizedEmail, phone, passwordHash, firstName, lastName, role: "owner" },
      });
      const token = signToken(user);
      return res.status(201).json({
        token,
        user: { id: user.id, accountId: user.accountId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, phone: user.phone },
      });
    }

    // For a resident: create a pending account (they get linked to a property/bed by an operator,
    // but for self-service signup we create a bare account + user; the resident record is created on allocation)
    const slug = normalizedEmail.split("@")[0] + "-" + Math.random().toString(36).slice(2, 6);
    const account = await prisma.account.create({
      data: { name: name.trim(), slug, email: normalizedEmail, phone, plan: "trial", status: "active" },
    });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { accountId: account.id, email: normalizedEmail, phone, passwordHash, firstName, lastName, role: "resident" },
    });
    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user.id, accountId: user.accountId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, phone: user.phone },
    });
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(409).json({ error: "An account with this email already exists" });
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: "No account found with this email. Please sign up first." });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password. Please try again." });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, accountId: user.accountId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    user: { id: user.id, accountId: user.accountId, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, phone: user.phone },
  });
});

export default router;
