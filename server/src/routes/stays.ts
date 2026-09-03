import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// POST /api/stays — allocate a bed to a resident (check-in)
// Body: { residentId, bedId, checkInDate, expectedCheckOut, rentAmount, depositAmount }
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { residentId, bedId, checkInDate, expectedCheckOut, rentAmount, depositAmount } = req.body;

    // Verify the bed is available and belongs to the operator's account
    const bed = await prisma.bed.findFirst({
      where: { id: bedId, room: { floor: { building: { property: accountScope(req) } } } },
    });
    if (!bed) return res.status(404).json({ error: "Bed not found" });
    if (bed.status !== "available") return res.status(409).json({ error: "Bed is not available" });

    // Verify resident
    const resident = await prisma.resident.findFirst({ where: { id: residentId, ...accountScope(req) } });
    if (!resident) return res.status(404).json({ error: "Resident not found" });

    // Create the stay
    const stay = await prisma.stay.create({
      data: {
        residentId, bedId, checkInDate: checkInDate || new Date().toISOString().slice(0, 10),
        expectedCheckOut, rentAmount: Number(rentAmount), depositAmount: Number(depositAmount) || 0,
        depositStatus: Number(depositAmount) > 0 ? "held" : "held",
        status: "active", createdById: req.user!.sub,
      },
    });

    // Mark bed as occupied and link resident
    await prisma.bed.update({ where: { id: bedId }, data: { status: "occupied" } });
    await prisma.resident.update({ where: { id: residentId }, data: { bedId, status: "active" } });

    res.status(201).json(stay);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to allocate bed" }); }
});

// GET /api/residents/:residentId/stays
router.get("/residents/:residentId/stays", async (req: AuthedRequest, res) => {
  const stays = await prisma.stay.findMany({
    where: { residentId: req.params.residentId, resident: accountScope(req) },
    include: { bed: { include: { room: { include: { floor: { include: { building: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(stays);
});

// POST /api/stays/:id/check-out
router.post("/:id/check-out", async (req: AuthedRequest, res) => {
  try {
    const { actualCheckOut, depositStatus } = req.body;
    const stay = await prisma.stay.findFirst({
      where: { id: req.params.id, resident: accountScope(req) },
      include: { bed: true },
    });
    if (!stay) return res.status(404).json({ error: "Stay not found" });
    if (stay.status === "checked_out") return res.status(409).json({ error: "Stay already checked out" });

    const updated = await prisma.stay.update({
      where: { id: stay.id },
      data: { status: "checked_out", actualCheckOut: actualCheckOut || new Date().toISOString().slice(0, 10), depositStatus: depositStatus || "refunded" },
    });

    // Free the bed
    if (stay.bed) {
      await prisma.bed.update({ where: { id: stay.bedId }, data: { status: "available" } });
    }
    await prisma.resident.update({ where: { id: stay.residentId }, data: { bedId: null, status: "checked_out" } });

    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to check out" }); }
});

// POST /api/stays/:id/transfer — move resident to a new bed
router.post("/:id/transfer", async (req: AuthedRequest, res) => {
  try {
    const { newBedId, checkInDate } = req.body;
    const stay = await prisma.stay.findFirst({
      where: { id: req.params.id, resident: accountScope(req) },
      include: { bed: true },
    });
    if (!stay) return res.status(404).json({ error: "Stay not found" });
    if (stay.status !== "active") return res.status(409).json({ error: "Stay is not active" });

    const newBed = await prisma.bed.findFirst({
      where: { id: newBedId, room: { floor: { building: { property: accountScope(req) } } } },
    });
    if (!newBed) return res.status(404).json({ error: "Target bed not found" });
    if (newBed.status !== "available") return res.status(409).json({ error: "Target bed is not available" });

    // Mark old stay as transferred, free old bed
    await prisma.stay.update({ where: { id: stay.id }, data: { status: "transferred", actualCheckOut: checkInDate || new Date().toISOString().slice(0, 10) } });
    if (stay.bed) {
      await prisma.bed.update({ where: { id: stay.bedId }, data: { status: "available" } });
    }

    // Create new stay at the new bed
    const newStay = await prisma.stay.create({
      data: {
        residentId: stay.residentId, bedId: newBedId,
        checkInDate: checkInDate || new Date().toISOString().slice(0, 10),
        rentAmount: stay.rentAmount, depositAmount: stay.depositAmount,
        depositStatus: "held", status: "active", createdById: req.user!.sub,
      },
    });
    await prisma.bed.update({ where: { id: newBedId }, data: { status: "occupied" } });
    await prisma.resident.update({ where: { id: stay.residentId }, data: { bedId: newBedId } });

    res.status(201).json(newStay);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to transfer" }); }
});

export default router;
