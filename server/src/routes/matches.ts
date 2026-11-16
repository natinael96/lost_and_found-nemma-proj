import { Router, Request, Response } from "express";
import { findMatches, dismissMatch, confirmMatch } from "../services/matcher.js";
import { DismissMatchSchema, ConfirmMatchSchema } from "../validation/report.schema.js";

const router = Router();

// GET /api/matches - calculate potential matches
router.get("/", (req: Request, res: Response) => {
  try {
    const { reportId, minClassification } = req.query;

    const parsedReportId = reportId ? parseInt(reportId as string, 10) : undefined;
    const classification = (minClassification as "Strong" | "Possible" | "All") || undefined;

    const matches = findMatches({
      reportId: parsedReportId && !isNaN(parsedReportId) ? parsedReportId : undefined,
      minClassification: classification,
    });

    res.json(matches);
  } catch (error) {
    console.error("Error calculating matches:", error);
    res.status(500).json({ error: "Failed to calculate matches" });
  }
});

// POST /api/matches/dismiss - dismiss a suggestion pair
router.post("/dismiss", (req: Request, res: Response) => {
  try {
    const validation = DismissMatchSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { lost_report_id, found_report_id } = validation.data;
    const dismissed = dismissMatch(lost_report_id, found_report_id);

    res.json({ success: true, dismissed });
  } catch (error) {
    console.error("Error dismissing match:", error);
    res.status(500).json({ error: "Failed to dismiss match" });
  }
});

// POST /api/matches/confirm - atomically confirm a match pair
router.post("/confirm", (req: Request, res: Response) => {
  try {
    const validation = ConfirmMatchSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { lost_report_id, found_report_id } = validation.data;
    const result = confirmMatch(lost_report_id, found_report_id);

    if (!result.success) {
      return res.status(400).json({
        error: result.message || "Failed to confirm match",
      });
    }

    res.json({
      success: true,
      lostReport: result.lostReport,
      foundReport: result.foundReport,
    });
  } catch (error) {
    console.error("Error confirming match:", error);
    res.status(500).json({ error: "Failed to confirm match" });
  }
});

export default router;
