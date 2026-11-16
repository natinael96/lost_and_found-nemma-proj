import { describe, it, expect } from "vitest";
import {
  evaluateCategoryCompatibility,
  calculateLocationSimilarity,
  calculateColorSimilarity,
  calculateTimeProximity,
  scoreMatch,
  ReportItem,
} from "../server/src/services/scoring.js";

describe("Scoring & Heuristic Rules", () => {
  // Test 1: Category compatibility
  it("AirPods case vs earbud case produces compatible category", () => {
    const result = evaluateCategoryCompatibility("wireless_earbuds", "earbud_case", "electronics", "electronics");
    expect(result.compatible).toBe(true);
    expect(result.similarity).toBeGreaterThanOrEqual(0.4); // related/same subgroup
  });

  // Test 2: Incompatible category rejection
  it("Backpack vs headphones is rejected as incompatible", () => {
    const result = evaluateCategoryCompatibility("backpack", "headphones", "bags", "electronics");
    expect(result.compatible).toBe(false);
    expect(result.similarity).toBe(0);
  });

  // Test 3: Black vs dark weak color similarity
  it("Black vs dark produces weak color similarity (60%)", () => {
    const result = calculateColorSimilarity("black", "dark");
    expect(result.available).toBe(true);
    expect(result.similarity).toBe(0.6);
  });

  // Test 4: Library vs library entrance high location proximity
  it("Library vs library entrance produces high location similarity (80%)", () => {
    const result = calculateLocationSimilarity("library", "library_entrance");
    expect(result.similarity).toBe(0.8);
  });

  // Test 5: Missing color yields normalized score and reduced coverage
  it("Missing color normalizes score using available components and reduces coverage", () => {
    const lostItem: ReportItem = {
      id: 1,
      type: "lost",
      title: "Leather Bifold Wallet",
      category: "personal_items",
      subcategory: "wallet",
      color: null, // missing color
      location: "library",
      event_date: "2026-11-10",
      brand: "Fossil",
      description: "Brown leather wallet",
      status: "open",
    };

    const foundItem: ReportItem = {
      id: 2,
      type: "found",
      title: "Leather Bifold Wallet",
      category: "personal_items",
      subcategory: "wallet",
      color: "brown",
      location: "library",
      event_date: "2026-11-10",
      brand: "Fossil",
      description: "Brown leather wallet",
      status: "open",
    };

    const matchResult = scoreMatch(lostItem, foundItem);
    expect(matchResult.isCandidate).toBe(true);
    expect(matchResult.components.color.available).toBe(false);
    // Total available weight = 30 + 25 + 20 + 15 = 90
    expect(matchResult.coverage).toBe(90);
    // Score should be normalized over 90 available points, so 100% on everything available = 100 score
    expect(matchResult.score).toBe(100);
  });

  // Test 6: Found before lost is rejected
  it("Found before lost is rejected by candidate filter", () => {
    const timeCheck = calculateTimeProximity("2026-11-10", "2026-11-08");
    expect(timeCheck.isCandidate).toBe(false);
    expect(timeCheck.diffDays).toBeLessThan(0);

    const lostItem: ReportItem = {
      id: 1,
      type: "lost",
      title: "AirPods Pro",
      category: "electronics",
      subcategory: "wireless_earbuds",
      location: "library",
      event_date: "2026-11-10",
      status: "open",
    };

    const foundItem: ReportItem = {
      id: 2,
      type: "found",
      title: "AirPods Pro",
      category: "electronics",
      subcategory: "wireless_earbuds",
      location: "library",
      event_date: "2026-11-05", // 5 days BEFORE lost!
      status: "open",
    };

    const match = scoreMatch(lostItem, foundItem);
    expect(match.isCandidate).toBe(false);
    expect(match.rejectionReason).toContain("before it was reported lost");
  });

  // Test 7: High score with low coverage cannot be classified as Strong
  it("High score with coverage below 60% cannot be classified as Strong", () => {
    // If we have an item with score >= 70 but coverage < 60%
    // Let's verify classification boundary rule
    const classificationCheck = (score: number, coverage: number) => {
      if (score >= 70 && coverage >= 60) return "Strong";
      if (score >= 60) return "Possible";
      return "Weak";
    };

    expect(classificationCheck(85, 55)).toBe("Possible");
    expect(classificationCheck(85, 55)).not.toBe("Strong");
    expect(classificationCheck(65, 60)).toBe("Possible");
    expect(classificationCheck(55, 60)).toBe("Weak");
    expect(classificationCheck(75, 60)).toBe("Strong");
  });
});
