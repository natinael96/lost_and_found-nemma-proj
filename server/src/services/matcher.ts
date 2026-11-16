import { db } from "../database/db.js";
import { scoreMatch, ReportItem, MatchScoreResult } from "./scoring.js";

export interface MatchPairResult {
  lostReport: ReportItem;
  foundReport: ReportItem;
  match: MatchScoreResult;
}

export function findMatches(options?: {
  reportId?: number;
  minClassification?: "Strong" | "Possible" | "All";
}): MatchPairResult[] {
  // 1. Fetch dismissed matches
  const dismissedStmt = db.prepare("SELECT lost_report_id, found_report_id FROM dismissed_matches");
  const dismissedRows = dismissedStmt.all() as { lost_report_id: number; found_report_id: number }[];
  const dismissedSet = new Set<string>();
  for (const row of dismissedRows) {
    dismissedSet.add(`${row.lost_report_id}_${row.found_report_id}`);
  }

  // 2. Fetch open lost reports and found reports
  let lostReports: ReportItem[] = [];
  let foundReports: ReportItem[] = [];

  if (options?.reportId) {
    const singleStmt = db.prepare("SELECT * FROM reports WHERE id = ? AND status = 'open'");
    const target = singleStmt.get(options.reportId) as ReportItem | undefined;
    if (!target) return [];

    if (target.type === "lost") {
      lostReports = [target];
      foundReports = db.prepare("SELECT * FROM reports WHERE type = 'found' AND status = 'open'").all() as ReportItem[];
    } else {
      foundReports = [target];
      lostReports = db.prepare("SELECT * FROM reports WHERE type = 'lost' AND status = 'open'").all() as ReportItem[];
    }
  } else {
    lostReports = db.prepare("SELECT * FROM reports WHERE type = 'lost' AND status = 'open'").all() as ReportItem[];
    foundReports = db.prepare("SELECT * FROM reports WHERE type = 'found' AND status = 'open'").all() as ReportItem[];
  }

  const results: MatchPairResult[] = [];

  for (const lost of lostReports) {
    for (const found of foundReports) {
      // Exclude dismissed pairs
      if (dismissedSet.has(`${lost.id}_${found.id}`)) {
        continue;
      }

      const match = scoreMatch(lost, found);

      // Must be a valid candidate (passed hard filters: open, found >= lost, compatible category, <= 30 days)
      if (!match.isCandidate) {
        continue;
      }

      // Filter by classification if specified
      if (options?.minClassification === "Strong" && match.classification !== "Strong") {
        continue;
      }
      if (
        options?.minClassification === "Possible" &&
        match.classification !== "Strong" &&
        match.classification !== "Possible"
      ) {
        continue;
      }

      results.push({
        lostReport: lost,
        foundReport: found,
        match,
      });
    }
  }

  // Sort by score descending, then by coverage descending
  results.sort((a, b) => {
    if (b.match.score !== a.match.score) {
      return b.match.score - a.match.score;
    }
    return b.match.coverage - a.match.coverage;
  });

  return results;
}

export function dismissMatch(lostReportId: number, foundReportId: number): boolean {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO dismissed_matches (lost_report_id, found_report_id)
    VALUES (?, ?)
  `);
  const info = insertStmt.run(lostReportId, foundReportId);
  return info.changes > 0;
}

export function confirmMatch(
  lostReportId: number,
  foundReportId: number
): {
  success: boolean;
  lostReport?: ReportItem;
  foundReport?: ReportItem;
  message?: string;
} {
  const checkStmt = db.prepare("SELECT * FROM reports WHERE id IN (?, ?)");
  const reports = checkStmt.all(lostReportId, foundReportId) as ReportItem[];

  const lost = reports.find((r) => r.id === lostReportId);
  const found = reports.find((r) => r.id === foundReportId);

  if (!lost || !found) {
    return { success: false, message: "One or both reports do not exist." };
  }

  if (lost.type !== "lost" || found.type !== "found") {
    return { success: false, message: "Invalid pair: one must be lost and one found." };
  }

  if (lost.status !== "open" || found.status !== "open") {
    return {
      success: false,
      message: "Cannot confirm match: one or both reports are already claimed or closed.",
    };
  }

  // Atomically update both reports to 'claimed' in a SQLite transaction
  const updateStmt = db.prepare("UPDATE reports SET status = 'claimed' WHERE id = ?");
  const runTransaction = db.transaction(() => {
    updateStmt.run(lostReportId);
    updateStmt.run(foundReportId);
  });

  runTransaction();

  const updatedLost = db.prepare("SELECT * FROM reports WHERE id = ?").get(lostReportId) as ReportItem;
  const updatedFound = db.prepare("SELECT * FROM reports WHERE id = ?").get(foundReportId) as ReportItem;

  return { success: true, lostReport: updatedLost, foundReport: updatedFound };
}
