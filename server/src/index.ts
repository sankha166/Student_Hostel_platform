import express from "express";
import cors from "cors";
import { authMiddleware } from "./lib/auth.js";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import inventoryRoutes from "./routes/inventory.js";
import residentRoutes from "./routes/residents.js";
import stayRoutes from "./routes/stays.js";
import paymentRoutes from "./routes/payments.js";
import complaintRoutes from "./routes/complaints.js";
import dashboardRoutes from "./routes/dashboard.js";
import residentPortalRoutes from "./routes/residentPortal.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api", inventoryRoutes);        // /api/properties/:id/inventory, /api/buildings, /api/beds, etc.
app.use("/api", residentRoutes);          // /api/properties/:id/residents, /api/residents/:id
app.use("/api/stays", stayRoutes);
app.use("/api", paymentRoutes);           // /api/properties/:id/payments, /api/payments, /api/residents/:id/payments
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resident", residentPortalRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🏠 Residential Nexus API running on http://0.0.0.0:${PORT}`);
});
