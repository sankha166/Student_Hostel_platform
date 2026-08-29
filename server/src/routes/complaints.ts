import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

const SLA_BY_PRIORITY: Record<string, number> = { low: 168, medium: 48, high: 24, critical: 4 };

// GET /api/properties/:propertyId/complaints
router.get("/properties/:propertyId/complaints", async (req: AuthedRequest, res) => {
  const complaints = await prisma.complaint.findMany({
    where: { propertyId: req.params.propertyId, ...accountScope(req) },
    include: { resident: true, assignedTo: true, room: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(complaints);
});

// GET /api/complaints/:id
router.get("/:id", async (req: AuthedRequest, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, ...accountScope(req) },
    include: { resident: true, assignedTo: true, room: true, property: true },
  });
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });
  res.json(complaint);
});

// POST /api/complaints — create (operator or resident)
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { propertyId, residentId, category, subCategory, title, description, priority, roomId, bedId } = req.body;
    const prio = priority || "medium";
    const slaHours = SLA_BY_PRIORITY[prio] || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    const complaint = await prisma.complaint.create({
      data: {
        accountId: req.user!.accountId, propertyId, residentId: residentId || null,
        category, subCategory, title, description, priority: prio,
        roomId: roomId || null, bedId: bedId || null,
        slaHours, slaDeadline,
      },
      include: { resident: true },
    });
    res.status(201).json(complaint);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create complaint" }); }
});

// PATCH /api/complaints/:id — update status / assign / resolve
router.patch("/:id", async (req: AuthedRequest, res) => {
  try {
    const { status, assignedToId, priority, resolutionNotes, residentRating, residentFeedback } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (priority) {
      data.priority = priority;
      data.slaHours = SLA_BY_PRIORITY[priority] || 48;
      data.slaDeadline = new Date(Date.now() + data.slaHours * 3600 * 1000);
    }
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;
    if (status === "resolved" || status === "closed") {
      data.resolvedAt = new Date();
      data.resolvedById = req.user!.sub;
    }
    if (residentRating != null) data.residentRating = Number(residentRating);
    if (residentFeedback !== undefined) data.residentFeedback = residentFeedback;

    // Check SLA breach on update
    const existing = await prisma.complaint.findFirst({ where: { id: req.params.id, ...accountScope(req) } });
    if (existing && !existing.slaBreached && existing.slaDeadline && new Date() > existing.slaDeadline) {
      data.slaBreached = true;
    }

    await prisma.complaint.updateMany({ where: { id: req.params.id, ...accountScope(req) }, data });
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: { resident: true, assignedTo: true, room: true },
    });
    res.json(complaint);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update complaint" }); }
});

export default router;
