import Fuse from "fuse.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "is", "it", "my"
]);

/**
 * Normalizes text:
 * - Lowercase
 * - Remove punctuation
 * - Normalize whitespace
 * - Filter out filler/stop words
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts meaningful non-stopword tokens from text.
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export interface DistinctiveAttributeFields {
  title: string;
  brand?: string | null;
  description?: string | null;
  distinguishing_features?: string | null;
}

/**
 * Calculates attribute similarity between two reports using Fuse.js for fuzzy matching
 * and keyword overlap analysis.
 * Returns a similarity score between 0.0 and 1.0.
 */
export function calculateAttributeSimilarity(
  itemA: DistinctiveAttributeFields,
  itemB: DistinctiveAttributeFields
): { similarity: number; explanation: string } {
  // Combine all descriptive text
  const partsA = [
    itemA.title,
    itemA.brand || "",
    itemA.description || "",
    itemA.distinguishing_features || "",
  ].filter(Boolean);

  const partsB = [
    itemB.title,
    itemB.brand || "",
    itemB.description || "",
    itemB.distinguishing_features || "",
  ].filter(Boolean);

  const textA = partsA.join(" ");
  const textB = partsB.join(" ");

  const keywordsA = extractKeywords(textA);
  const keywordsB = extractKeywords(textB);

  // If both have essentially no text beyond stopwords/blanks
  if (keywordsA.length === 0 || keywordsB.length === 0) {
    return { similarity: 0, explanation: "Insufficient text for attribute comparison" };
  }

  // 1. Direct Title & Brand fuzzy score using Fuse.js
  const titleA = normalizeText(itemA.title);
  const titleB = normalizeText(itemB.title);

  let titleSimilarity = 0;
  if (titleA === titleB) {
    titleSimilarity = 1.0;
  } else {
    const fuseTitle = new Fuse([titleB], {
      includeScore: true,
      threshold: 0.5,
    });
    const titleResult = fuseTitle.search(titleA);
    if (titleResult.length > 0 && titleResult[0].score !== undefined) {
      titleSimilarity = Math.max(0, 1 - titleResult[0].score);
    }
  }

  // Brand comparison
  let brandSimilarity: number | null = null;
  if (itemA.brand && itemB.brand) {
    const bA = normalizeText(itemA.brand);
    const bB = normalizeText(itemB.brand);
    if (bA === bB) {
      brandSimilarity = 1.0;
    } else {
      const fuseBrand = new Fuse([bB], { includeScore: true, threshold: 0.4 });
      const bRes = fuseBrand.search(bA);
      brandSimilarity = bRes.length > 0 && bRes[0].score !== undefined ? 1 - bRes[0].score : 0;
    }
  }

  // 2. Keyword fuzzy matching across all attributes using Fuse.js
  // For each keyword in A, find best fuzzy match in B's keywords
  const fuseB = new Fuse(keywordsB, {
    threshold: 0.35, // Strict enough to avoid spurious matches
    includeScore: true,
  });

  let matchedInB = 0;
  let totalScoreAtoB = 0;

  for (const kwA of keywordsA) {
    const match = fuseB.search(kwA);
    if (match.length > 0 && match[0].score !== undefined) {
      matchedInB++;
      totalScoreAtoB += 1 - match[0].score;
    }
  }

  const fuseA = new Fuse(keywordsA, {
    threshold: 0.35,
    includeScore: true,
  });

  let matchedInA = 0;
  let totalScoreBtoA = 0;

  for (const kwB of keywordsB) {
    const match = fuseA.search(kwB);
    if (match.length > 0 && match[0].score !== undefined) {
      matchedInA++;
      totalScoreBtoA += 1 - match[0].score;
    }
  }

  // Bidirectional recall & precision (Dice / F1 equivalent)
  const simA = keywordsA.length > 0 ? totalScoreAtoB / keywordsA.length : 0;
  const simB = keywordsB.length > 0 ? totalScoreBtoA / keywordsB.length : 0;
  const keywordSimilarity = (simA + simB) / 2;

  // Weighted composition:
  // Title carries 40%, Brand (if available) carries 20%, Keywords/desc carry 40%
  let finalSimilarity = 0;
  if (brandSimilarity !== null) {
    finalSimilarity = titleSimilarity * 0.35 + brandSimilarity * 0.25 + keywordSimilarity * 0.4;
  } else {
    finalSimilarity = titleSimilarity * 0.45 + keywordSimilarity * 0.55;
  }

  // Clamp between 0.0 and 1.0
  finalSimilarity = Math.min(1.0, Math.max(0.0, finalSimilarity));

  let explanation = "";
  if (finalSimilarity >= 0.8) {
    explanation = "High similarity in title, brand, and item description";
  } else if (finalSimilarity >= 0.5) {
    explanation = "Moderate keyword and feature similarity";
  } else if (finalSimilarity >= 0.25) {
    explanation = "Partial text overlap in description or brand";
  } else {
    explanation = "Low similarity in distinctive attributes";
  }

  return {
    similarity: finalSimilarity,
    explanation,
  };
}
