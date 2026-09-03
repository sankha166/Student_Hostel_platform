import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/properties/:propertyId/payments
router.get("/properties/:propertyId/payments", async (req: AuthedRequest, res) => {
  const payments = await prisma.payment.findMany({
    where: { accountId: req.user!.accountId, resident: { propertyId: req.params.propertyId } },
    include: { resident: true },
    orderBy: { dueDate: "desc" },
  });
  res.json(payments);
});

// GET /api/residents/:residentId/payments
router.get("/residents/:residentId/payments", async (req: AuthedRequest, res) => {
  const payments = await prisma.payment.findMany({
    where: { residentId: req.params.residentId, ...accountScope(req) },
    include: { resident: true },
    orderBy: { dueDate: "desc" },
  });
  res.json(payments);
});

// POST /api/payments — record a payment (operator records cash/UPI/bank)
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { residentId, type, amount, dueDate, paymentMethod, transactionId, rentMonth, rentYear, notes, stayId } = req.body;
    const resident = await prisma.resident.findFirst({ where: { id: residentId, ...accountScope(req) } });
    if (!resident) return res.status(404).json({ error: "Resident not found" });

    const payment = await prisma.payment.create({
      data: {
        accountId: req.user!.accountId, residentId, stayId,
        type: type || "rent", amount: Number(amount), dueDate,
        paidDate: new Date().toISOString().slice(0, 10),
        status: "paid", paidAmount: Number(amount),
        paymentMethod: paymentMethod || "cash", transactionId,
        rentMonth: rentMonth ? Number(rentMonth) : null, rentYear: rentYear ? Number(rentYear) : null,
        notes, createdById: req.user!.sub,
      },
      include: { resident: true },
    });
    res.status(201).json(payment);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to record payment" }); }
});

// PATCH /api/payments/:id — mark paid / update
router.patch("/:id", async (req: AuthedRequest, res) => {
  try {
    const { status, paidDate, paymentMethod, transactionId, paidAmount } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (paidDate) data.paidDate = paidDate;
    if (paymentMethod) data.paymentMethod = paymentMethod;
    if (transactionId) data.transactionId = transactionId;
    if (paidAmount != null) data.paidAmount = Number(paidAmount);
    if (status === "paid" && !paidDate) data.paidDate = new Date().toISOString().slice(0, 10);
    await prisma.payment.updateMany({ where: { id: req.params.id, ...accountScope(req) }, data });
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { resident: true } });
    res.json(payment);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update payment" }); }
});

// POST /api/properties/:propertyId/payments/generate-rent — monthly rent generation
// Creates pending rent payment records for all active residents for the given month/year
router.post("/properties/:propertyId/payments/generate-rent", async (req: AuthedRequest, res) => {
  try {
    const { month, year } = req.body;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const dueDate = `${y}-${String(m).padStart(2, "0")}-01`;

    // Get all active residents in this property with active stays
    const residents = await prisma.resident.findMany({
      where: { propertyId: req.params.propertyId, status: "active", ...accountScope(req), bed: { status: "occupied" } },
      include: { stays: { where: { status: "active" }, take: 1 } },
    });

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let created = 0;
    for (const r of residents) {
      // Skip if a rent payment already exists for this month
      const existing = await prisma.payment.findFirst({
        where: { residentId: r.id, type: "rent", rentMonth: m, rentYear: y },
      });
      if (existing) continue;

      const rentAmount = r.stays[0]?.rentAmount || 0;
      await prisma.payment.create({
        data: {
          accountId: req.user!.accountId, residentId: r.id, stayId: r.stays[0]?.id,
          type: "rent", amount: rentAmount, dueDate,
          status: "pending", rentMonth: m, rentYear: y,
          notes: `Rent for ${monthNames[m - 1]} ${y}`,
        },
      });
      created++;
    }
    res.json({ success: true, created, month: m, year: y });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to generate rent" }); }
});

export default router;
