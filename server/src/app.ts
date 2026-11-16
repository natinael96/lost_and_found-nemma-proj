import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import reportsRouter from "./routes/reports.js";
import matchesRouter from "./routes/matches.js";
import { categories } from "./config/categories.js";
import { campusLocations } from "./config/locations.js";
import { colorGroups } from "./config/colors.js";
import { seedData } from "./database/seed.js";

import { db } from "./database/db.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/reports", reportsRouter);
app.use("/api/matches", matchesRouter);

// Metadata route for taxonomy and dropdown configurations
app.get("/api/meta", (_req: Request, res: Response) => {
  res.json({
    categories,
    campusLocations,
    colorGroups,
  });
});

// Database reset endpoint for easy testing & demo exploration
app.post("/api/reset", (_req: Request, res: Response) => {
  try {
    seedData(true);
    res.json({ success: true, message: "Database reset to initial sample state successfully" });
  } catch (error) {
    console.error("Database reset failed:", error);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});
