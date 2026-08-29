import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// All routes here are for the resident's own data (role: resident)
// The resident's user is linked to a resident record via userId.

async function getResidentForUser(req: AuthedRequest) {
  return prisma.resident.findFirst({
    where: { userId: req.user!.sub },
    include: {
      property: true,
      bed: { include: { room: { include: { floor: { include: { building: true } } } } } },
      stays: { where: { status: "active" }, include: { bed: { include: { room: true } } }, take: 1 },
    },
  });
}

// GET /api/resident/profile
router.get("/profile", async (req: AuthedRequest, res) => {
  const resident = await getResidentForUser(req);
  if (!resident) return res.json({ resident: null, property: null, bed: null });
  res.json({
    resident,
    property: resident.property,
    bed: resident.bed,
    activeStay: resident.stays[0] || null,
  });
});

// PUT /api/resident/profile — update own info
router.put("/profile", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({ where: { userId: req.user!.sub } });
  if (!resident) return res.status(404).json({ error: "Resident profile not found" });
  const b = req.body;
  const fields = ["phone","dateOfBirth","gender","emergencyName","emergencyPhone","emergencyRelation","occupation","institution","photoUrl"];
  const data: any = {};
  for (const f of fields) if (b[f] !== undefined) data[f] = b[f];
  const updated = await prisma.resident.update({ where: { id: resident.id }, data });
  res.json(updated);
});

// GET /api/resident/payments
router.get("/payments", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({ where: { userId: req.user!.sub } });
  if (!resident) return res.json([]);
  const payments = await prisma.payment.findMany({
    where: { residentId: resident.id },
    orderBy: { dueDate: "desc" },
  });
  res.json(payments);
});

// POST /api/resident/payments/:id/pay — resident pays (marks as paid)
router.post("/payments/:id/pay", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({ where: { userId: req.user!.sub } });
  if (!resident) return res.status(404).json({ error: "Resident not found" });
  const { paymentMethod, transactionId } = req.body;
  const payment = await prisma.payment.update({
    where: { id: req.params.id, residentId: resident.id },
    data: {
      status: "paid",
      paidDate: new Date().toISOString().slice(0, 10),
      paidAmount: undefined,
      paymentMethod: paymentMethod || "upi",
      transactionId: transactionId || `TXN-${Date.now()}`,
    },
  });
  res.json(payment);
});

// GET /api/resident/complaints
router.get("/complaints", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({ where: { userId: req.user!.sub } });
  if (!resident) return res.json([]);
  const complaints = await prisma.complaint.findMany({
    where: { residentId: resident.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(complaints);
});

// POST /api/resident/complaints
router.post("/complaints", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({ where: { userId: req.user!.sub } });
  if (!resident) return res.status(404).json({ error: "Resident not found" });
  const { category, title, description, priority } = req.body;
  const prio = priority || "medium";
  const SLA: Record<string, number> = { low: 168, medium: 48, high: 24, critical: 4 };
  const slaHours = SLA[prio] || 48;
  const complaint = await prisma.complaint.create({
    data: {
      accountId: resident.accountId, propertyId: resident.propertyId, residentId: resident.id,
      category: category || "other", title, description, priority: prio,
      roomId: resident.bed?.roomId || null,
      slaHours, slaDeadline: new Date(Date.now() + slaHours * 3600 * 1000),
    },
  });
  res.status(201).json(complaint);
});

export default router;
