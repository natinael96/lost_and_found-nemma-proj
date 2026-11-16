import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../server/src/database/db.js";
import { seedData } from "../server/src/database/seed.js";
import { findMatches, dismissMatch, confirmMatch } from "../server/src/services/matcher.js";

describe("Matching Engine & Database Integration", () => {
  beforeEach(() => {
    seedData(true);
  });

  // Test 8: Dismissed or claimed reports excluded
  it("Dismissed and claimed reports are excluded from active suggestions", () => {
    const allMatches = findMatches();

    // 1. Check that claimed reports (Pair 7 Sony Headphones) are NOT in matches
    const claimedMatches = allMatches.filter(
      (m) =>
        m.lostReport.title.includes("Sony WH-1000XM4") ||
        m.foundReport.title.includes("Sony Over-Ear")
    );
    expect(claimedMatches.length).toBe(0);

    // 2. Check that pre-dismissed pair (Pair 6 Laptop Bag) is NOT in matches
    const dismissedMatches = allMatches.filter(
      (m) =>
        m.lostReport.title === "Grey Felt Laptop Sleeve" &&
        m.foundReport.title === "Gray Canvas Laptop Bag"
    );
    expect(dismissedMatches.length).toBe(0);

    // 3. Dismiss an active match dynamically and verify it gets excluded
    const initialAirPodsMatch = allMatches.find(
      (m) =>
        m.lostReport.title.includes("AirPods") &&
        m.foundReport.title.includes("AirPods")
    );
    expect(initialAirPodsMatch).toBeDefined();

    if (initialAirPodsMatch) {
      const dismissed = dismissMatch(
        initialAirPodsMatch.lostReport.id,
        initialAirPodsMatch.foundReport.id
      );
      expect(dismissed).toBe(true);

      const updatedMatches = findMatches();
      const afterDismiss = updatedMatches.find(
        (m) =>
          m.lostReport.id === initialAirPodsMatch.lostReport.id &&
          m.foundReport.id === initialAirPodsMatch.foundReport.id
      );
      expect(afterDismiss).toBeUndefined();
    }
  });

  it("Matches include clear explanations for each scoring component", () => {
    const matches = findMatches();
    expect(matches.length).toBeGreaterThan(0);

    const topMatch = matches[0];
    expect(topMatch.match.score).toBeGreaterThan(0);
    expect(topMatch.match.coverage).toBeGreaterThan(0);
    expect(topMatch.match.explanations.length).toBeGreaterThanOrEqual(4);
    expect(topMatch.match.classification).toBeDefined();
  });

  it("Confirming a match atomically updates both reports to claimed and prevents re-confirmation", () => {
    const matches = findMatches();
    expect(matches.length).toBeGreaterThan(0);

    const target = matches[0];
    const lostId = target.lostReport.id;
    const foundId = target.foundReport.id;

    // Confirm match
    const result = confirmMatch(lostId, foundId);
    expect(result.success).toBe(true);
    expect(result.lostReport?.status).toBe("claimed");
    expect(result.foundReport?.status).toBe("claimed");

    // Attempting to re-confirm fails
    const reconfirmResult = confirmMatch(lostId, foundId);
    expect(reconfirmResult.success).toBe(false);
    expect(reconfirmResult.message).toContain("already claimed or closed");

    // Confirmed reports disappear from active candidate matches
    const updatedMatches = findMatches();
    const stillPresent = updatedMatches.some(
      (m) => m.lostReport.id === lostId || m.foundReport.id === foundId
    );
    expect(stillPresent).toBe(false);
  });
});
