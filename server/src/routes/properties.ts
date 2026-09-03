import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/properties
router.get("/", async (req: AuthedRequest, res) => {
  const properties = await prisma.property.findMany({
    where: accountScope(req),
    orderBy: { createdAt: "desc" },
  });
  res.json(properties);
});

// GET /api/properties/:id  (with bed counts for occupancy)
router.get("/:id", async (req: AuthedRequest, res) => {
  const property = await prisma.property.findFirst({
    where: { id: req.params.id, ...accountScope(req) },
    include: {
      buildings: { include: { floors: { include: { rooms: { include: { beds: true } } } } } },
    },
  });
  if (!property) return res.status(404).json({ error: "Property not found" });
  res.json(property);
});

// POST /api/properties
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { name, type, address, city, state, pincode, latitude, longitude, contactPhone, contactEmail, amenities, imageUrl } = req.body;
    const property = await prisma.property.create({
      data: {
        accountId: req.user!.accountId,
        name, type: type || "hostel", address, city, state, pincode,
        latitude, longitude, contactPhone, contactEmail,
        amenities: amenities ?? [], imageUrl,
      },
    });
    res.status(201).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /api/properties/:id
router.put("/:id", async (req: AuthedRequest, res) => {
  try {
    const { name, type, address, city, state, pincode, latitude, longitude, contactPhone, contactEmail, amenities, imageUrl, rules, status } = req.body;
    const property = await prisma.property.updateMany({
      where: { id: req.params.id, ...accountScope(req) },
      data: { name, type, address, city, state, pincode, latitude, longitude, contactPhone, contactEmail, amenities, imageUrl, rules, status },
    });
    if (property.count === 0) return res.status(404).json({ error: "Property not found" });
    const updated = await prisma.property.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /api/properties/:id
router.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const result = await prisma.property.deleteMany({
      where: { id: req.params.id, ...accountScope(req) },
    });
    if (result.count === 0) return res.status(404).json({ error: "Property not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
