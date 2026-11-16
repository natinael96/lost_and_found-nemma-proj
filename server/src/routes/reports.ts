import { Router, Request, Response } from "express";
import { db } from "../database/db.js";
import { CreateReportSchema, UpdateStatusSchema } from "../validation/report.schema.js";

const router = Router();

// GET /api/reports - list reports with optional filters
router.get("/", (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    let query = "SELECT * FROM reports WHERE 1=1";
    const params: unknown[] = [];

    if (type && (type === "lost" || type === "found")) {
      query += " AND type = ?";
      params.push(type);
    }

    if (status && (status === "open" || status === "claimed" || status === "closed")) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC, id DESC";

    const reports = db.prepare(query).all(...params);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// GET /api/reports/:id - retrieve single report
router.get("/:id", (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Error retrieving report:", error);
    res.status(500).json({ error: "Failed to retrieve report" });
  }
});

// POST /api/reports - create new report
router.post("/", (req: Request, res: Response) => {
  try {
    const validation = CreateReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;
    const stmt = db.prepare(`
      INSERT INTO reports (
        type, title, category, subcategory, color, location,
        event_date, event_time, brand, description, distinguishing_features, status
      ) VALUES (
        @type, @title, @category, @subcategory, @color, @location,
        @event_date, @event_time, @brand, @description, @distinguishing_features, @status
      )
    `);

    const info = stmt.run(data);
    const created = db.prepare("SELECT * FROM reports WHERE id = ?").get(info.lastInsertRowid);

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// PATCH /api/reports/:id/status - update status (e.g. mark as claimed or closed)
router.patch("/:id/status", (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const validation = UpdateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { status } = validation.data;
    
    // Check existing report status to prevent invalid transitions
    const existing = db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as { status: string } | undefined;
    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (existing.status === status) {
      return res.json(existing);
    }

    const updateStmt = db.prepare("UPDATE reports SET status = ? WHERE id = ?");
    const info = updateStmt.run(status, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const updated = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    res.json(updated);
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ error: "Failed to update report status" });
  }
});

export default router;
