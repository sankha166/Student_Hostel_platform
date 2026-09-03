import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, accountScope, type AuthedRequest } from "../lib/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/properties/:propertyId/inventory — full hierarchy
router.get("/properties/:propertyId/inventory", async (req: AuthedRequest, res) => {
  const hierarchy = await prisma.building.findMany({
    where: { propertyId: req.params.propertyId, property: accountScope(req) },
    orderBy: { name: "asc" },
    include: {
      floors: {
        orderBy: { floorNumber: "asc" },
        include: {
          rooms: {
            orderBy: { roomNumber: "asc" },
            include: { beds: { orderBy: { bedNumber: "asc" } } },
          },
        },
      },
    },
  });
  res.json(hierarchy);
});

// --- Buildings ---
router.post("/properties/:propertyId/buildings", async (req: AuthedRequest, res) => {
  try {
    const { name, floorsCount } = req.body;
    const building = await prisma.building.create({
      data: { propertyId: req.params.propertyId, name, floorsCount },
    });
    res.status(201).json(building);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create building" }); }
});

router.delete("/buildings/:id", async (req: AuthedRequest, res) => {
  const result = await prisma.building.deleteMany({ where: { id: req.params.id, property: accountScope(req) } });
  if (result.count === 0) return res.status(404).json({ error: "Building not found" });
  res.json({ success: true });
});

// --- Floors ---
router.post("/buildings/:buildingId/floors", async (req: AuthedRequest, res) => {
  try {
    const { floorNumber, name } = req.body;
    const floor = await prisma.floor.create({
      data: { buildingId: req.params.buildingId, floorNumber: Number(floorNumber), name },
    });
    res.status(201).json(floor);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create floor" }); }
});

router.delete("/floors/:id", async (req: AuthedRequest, res) => {
  const result = await prisma.floor.deleteMany({ where: { id: req.params.id, building: { property: accountScope(req) } } });
  if (result.count === 0) return res.status(404).json({ error: "Floor not found" });
  res.json({ success: true });
});

// --- Rooms ---
router.post("/floors/:floorId/rooms", async (req: AuthedRequest, res) => {
  try {
    const { roomNumber, roomType, sharingType, rentAmount, depositAmount, amenities, status } = req.body;
    const room = await prisma.room.create({
      data: {
        floorId: req.params.floorId,
        roomNumber, roomType: roomType || "single", sharingType,
        rentAmount: Number(rentAmount), depositAmount: Number(depositAmount) || 0,
        amenities: amenities ?? [], status: status || "active",
      },
    });
    res.status(201).json(room);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create room" }); }
});

router.patch("/rooms/:id", async (req: AuthedRequest, res) => {
  try {
    const { roomNumber, roomType, rentAmount, depositAmount, amenities, status } = req.body;
    await prisma.room.updateMany({
      where: { id: req.params.id, floor: { building: { property: accountScope(req) } } },
      data: { roomNumber, roomType, rentAmount: rentAmount != null ? Number(rentAmount) : undefined, depositAmount: depositAmount != null ? Number(depositAmount) : undefined, amenities, status },
    });
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    res.json(room);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update room" }); }
});

router.delete("/rooms/:id", async (req: AuthedRequest, res) => {
  const result = await prisma.room.deleteMany({ where: { id: req.params.id, floor: { building: { property: accountScope(req) } } } });
  if (result.count === 0) return res.status(404).json({ error: "Room not found" });
  res.json({ success: true });
});

// --- Beds ---
router.post("/rooms/:roomId/beds", async (req: AuthedRequest, res) => {
  try {
    const { bedNumber, bedType, status, notes } = req.body;
    const bed = await prisma.bed.create({
      data: { roomId: req.params.roomId, bedNumber, bedType: bedType || "standard", status: status || "available", notes },
    });
    res.status(201).json(bed);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create bed" }); }
});

// PATCH /api/beds/:id — update bed status (used by allocation/check-out/transfer)
router.patch("/beds/:id", async (req: AuthedRequest, res) => {
  try {
    const { status, notes } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    await prisma.bed.updateMany({
      where: { id: req.params.id, room: { floor: { building: { property: accountScope(req) } } } },
      data,
    });
    const bed = await prisma.bed.findUnique({ where: { id: req.params.id } });
    res.json(bed);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update bed" }); }
});

router.delete("/beds/:id", async (req: AuthedRequest, res) => {
  const result = await prisma.bed.deleteMany({ where: { id: req.params.id, room: { floor: { building: { property: accountScope(req) } } } } });
  if (result.count === 0) return res.status(404).json({ error: "Bed not found" });
  res.json({ success: true });
});

// GET /api/properties/:propertyId/available-beds
router.get("/properties/:propertyId/available-beds", async (req: AuthedRequest, res) => {
  const beds = await prisma.bed.findMany({
    where: {
      status: "available",
      room: { floor: { building: { propertyId: req.params.propertyId, property: accountScope(req) } } },
    },
    include: { room: { include: { floor: { include: { building: true } } } } },
    orderBy: { bedNumber: "asc" },
  });
  res.json(beds);
});

export default router;
