import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard/overview — portfolio-wide stats for the operator
router.get("/overview", async (req: AuthedRequest, res) => {
  const accountId = req.user!.accountId;

  const properties = await prisma.property.findMany({ where: { accountId }, include: { buildings: { include: { floors: { include: { rooms: { include: { beds: true } } } } } } } });

  let totalBeds = 0, occupiedBeds = 0, availableBeds = 0, maintenanceBeds = 0;
  for (const p of properties) {
    for (const b of p.buildings) for (const f of b.floors) for (const r of f.rooms) for (const bed of r.beds) {
      totalBeds++;
      if (bed.status === "occupied") occupiedBeds++;
      else if (bed.status === "available") availableBeds++;
      else if (bed.status === "maintenance") maintenanceBeds++;
    }
  }

  const residents = await prisma.resident.findMany({ where: { accountId, status: "active" } });
  const payments = await prisma.payment.findMany({ where: { accountId } });
  const collected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0);
  const pending = payments.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const overdue = payments.filter(p => p.status === "overdue").length;

  const complaints = await prisma.complaint.findMany({ where: { accountId } });
  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "in_progress").length;
  const slaBreached = complaints.filter(c => c.slaBreached).length;

  res.json({
    totalProperties: properties.length,
    totalBeds, occupiedBeds, availableBeds, maintenanceBeds,
    occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    activeResidents: residents.length,
    totalCollected: collected,
    totalPending: pending,
    overdueCount: overdue,
    openComplaints,
    slaBreached,
    properties: properties.map(p => {
      let tBeds = 0, oBeds = 0;
      for (const b of p.buildings) for (const f of b.floors) for (const r of f.rooms) for (const bed of r.beds) {
        tBeds++; if (bed.status === "occupied") oBeds++;
      }
      return { id: p.id, name: p.name, type: p.type, city: p.city, imageUrl: p.imageUrl, totalBeds: tBeds, occupiedBeds: oBeds, occupancyRate: tBeds > 0 ? Math.round((oBeds / tBeds) * 100) : 0 };
    }),
  });
});

// GET /api/dashboard/properties/:id — single property stats
router.get("/properties/:id", async (req: AuthedRequest, res) => {
  const property = await prisma.property.findFirst({
    where: { id: req.params.id, ...accountScope(req) },
    include: { buildings: { include: { floors: { include: { rooms: { include: { beds: true } } } } } } },
  });
  if (!property) return res.status(404).json({ error: "Property not found" });

  let totalBeds = 0, occupiedBeds = 0, availableBeds = 0, maintenanceBeds = 0;
  for (const b of property.buildings) for (const f of b.floors) for (const r of f.rooms) for (const bed of r.beds) {
    totalBeds++;
    if (bed.status === "occupied") occupiedBeds++;
    else if (bed.status === "available") availableBeds++;
    else if (bed.status === "maintenance") maintenanceBeds++;
  }

  const residents = await prisma.resident.findMany({ where: { propertyId: property.id, ...accountScope(req) } });
  const payments = await prisma.payment.findMany({ where: { resident: { propertyId: property.id }, ...accountScope(req) } });
  const complaints = await prisma.complaint.findMany({ where: { propertyId: property.id, ...accountScope(req) } });

  res.json({
    property: { id: property.id, name: property.name, type: property.type, address: property.address, city: property.city },
    totalBeds, occupiedBeds, availableBeds, maintenanceBeds,
    occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    activeResidents: residents.filter(r => r.status === "active").length,
    totalCollected: payments.filter(p => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0),
    totalPending: payments.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + (p.amount - p.paidAmount), 0),
    openComplaints: complaints.filter(c => c.status === "open" || c.status === "in_progress").length,
    slaBreached: complaints.filter(c => c.slaBreached).length,
  });
});

export default router;
