import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/properties/:propertyId/residents
router.get("/properties/:propertyId/residents", async (req: AuthedRequest, res) => {
  const residents = await prisma.resident.findMany({
    where: { propertyId: req.params.propertyId, ...accountScope(req) },
    include: { bed: { include: { room: { include: { floor: { include: { building: true } } } } } }, user: true },
    orderBy: { firstName: "asc" },
  });
  res.json(residents);
});

// GET /api/residents/:id
router.get("/residents/:id", async (req: AuthedRequest, res) => {
  const resident = await prisma.resident.findFirst({
    where: { id: req.params.id, ...accountScope(req) },
    include: {
      bed: { include: { room: { include: { floor: { include: { building: true } } } } } },
      property: true,
      stays: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!resident) return res.status(404).json({ error: "Resident not found" });
  res.json(resident);
});

// POST /api/properties/:propertyId/residents
router.post("/properties/:propertyId/residents", async (req: AuthedRequest, res) => {
  try {
    const b = req.body;
    const resident = await prisma.resident.create({
      data: {
        accountId: req.user!.accountId,
        propertyId: req.params.propertyId,
        firstName: b.firstName, lastName: b.lastName,
        email: b.email, phone: b.phone,
        dateOfBirth: b.dateOfBirth, gender: b.gender,
        idType: b.idType, idNumber: b.idNumber, idDocumentUrl: b.idDocumentUrl, photoUrl: b.photoUrl,
        emergencyName: b.emergencyName, emergencyPhone: b.emergencyPhone, emergencyRelation: b.emergencyRelation,
        occupation: b.occupation, institution: b.institution,
      },
    });
    res.status(201).json(resident);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create resident" }); }
});

// PUT /api/residents/:id
router.put("/residents/:id", async (req: AuthedRequest, res) => {
  try {
    const b = req.body;
    const fields = ["firstName","lastName","email","phone","dateOfBirth","gender","idType","idNumber","idDocumentUrl","photoUrl","emergencyName","emergencyPhone","emergencyRelation","occupation","institution","status"];
    const data: any = {};
    for (const f of fields) if (b[f] !== undefined) data[f] = b[f];
    await prisma.resident.updateMany({ where: { id: req.params.id, ...accountScope(req) }, data });
    const resident = await prisma.resident.findUnique({ where: { id: req.params.id } });
    res.json(resident);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update resident" }); }
});

// DELETE /api/residents/:id
router.delete("/residents/:id", async (req: AuthedRequest, res) => {
  const result = await prisma.resident.deleteMany({ where: { id: req.params.id, ...accountScope(req) } });
  if (result.count === 0) return res.status(404).json({ error: "Resident not found" });
  res.json({ success: true });
});

export default router;
