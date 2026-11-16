import { categories, relatedCategories, CategoryKey } from "../config/categories.js";
import { campusLocations } from "../config/locations.js";
import { colorGroups } from "../config/colors.js";
import { calculateAttributeSimilarity, DistinctiveAttributeFields } from "./textSimilarity.js";

export interface ReportItem extends DistinctiveAttributeFields {
  id: number;
  type: "lost" | "found";
  title: string;
  category: string;
  subcategory: string;
  color?: string | null;
  location: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string | null;
  brand?: string | null;
  description?: string | null;
  distinguishing_features?: string | null;
  status: "open" | "claimed" | "closed";
  created_at?: string;
}

export type MatchClassification = "Strong" | "Possible" | "Weak";

export interface ComponentBreakdown {
  name: string;
  weight: number;
  available: boolean;
  similarity: number; // 0.0 to 1.0
  contribution: number; // normalized contribution or raw points
  explanation: string;
}

export interface MatchScoreResult {
  isCandidate: boolean;
  rejectionReason?: string;
  score: number; // 0 to 100
  coverage: number; // 0 to 100 percentage
  classification: MatchClassification;
  explanations: string[];
  components: {
    category: ComponentBreakdown;
    attributes: ComponentBreakdown;
    location: ComponentBreakdown;
    time: ComponentBreakdown;
    color: ComponentBreakdown;
  };
}

export const WEIGHTS = {
  category: 30,
  attributes: 25,
  location: 20,
  time: 15,
  color: 10,
} as const;

/**
 * Evaluates category compatibility and returns similarity between 0.0 and 1.0.
 * If incompatible, returns { compatible: false, similarity: 0 }.
 */
export function evaluateCategoryCompatibility(
  subA: string,
  subB: string,
  catA?: string,
  catB?: string
): { compatible: boolean; similarity: number; explanation: string } {
  // 1. Exact subcategory match -> 100%
  if (subA.toLowerCase() === subB.toLowerCase()) {
    return {
      compatible: true,
      similarity: 1.0,
      explanation: `Exact subcategory match (${formatLabel(subA)})`,
    };
  }

  // Find parent categories if not directly provided
  const findParent = (sub: string, directCat?: string): { parentCat: string; subGroup: string } | null => {
    for (const [cKey, subGroups] of Object.entries(categories)) {
      if (directCat && directCat !== cKey) continue;
      for (const [sgKey, subs] of Object.entries(subGroups)) {
        if ((subs as readonly string[]).includes(sub)) {
          return { parentCat: cKey, subGroup: sgKey };
        }
      }
    }
    return null;
  };

  const pA = findParent(subA, catA);
  const pB = findParent(subB, catB);

  // 2. Same parent category or subgroup -> 70%
  if (pA && pB) {
    if (pA.parentCat === pB.parentCat) {
      const sameGroup = pA.subGroup === pB.subGroup;
      return {
        compatible: true,
        similarity: 0.7,
        explanation: sameGroup
          ? `Compatible ${formatLabel(pA.subGroup)} category`
          : `Compatible parent category (${formatLabel(pA.parentCat)})`,
      };
    }
  }

  // 3. Related category (cross-category) -> 40%
  const relatedA = relatedCategories[subA] || [];
  const relatedB = relatedCategories[subB] || [];
  if (relatedA.includes(subB) || relatedB.includes(subA)) {
    return {
      compatible: true,
      similarity: 0.4,
      explanation: `Related category (${formatLabel(subA)} ↔ ${formatLabel(subB)})`,
    };
  }

  // 4. Incompatible category -> Reject
  return {
    compatible: false,
    similarity: 0.0,
    explanation: `Incompatible categories: ${formatLabel(subA)} vs ${formatLabel(subB)}`,
  };
}

/**
 * Calculates location proximity similarity between 0.0 and 1.0.
 */
export function calculateLocationSimilarity(
  locA: string,
  locB: string
): { similarity: number; explanation: string } {
  const normA = locA.toLowerCase();
  const normB = locB.toLowerCase();

  // Same location -> 100%
  if (normA === normB) {
    return {
      similarity: 1.0,
      explanation: `Same campus location (${formatLabel(locA)})`,
    };
  }

  const infoA = campusLocations[normA];
  const infoB = campusLocations[normB];

  // If either location is not recognized in taxonomy, return weak distance
  if (!infoA || !infoB) {
    return {
      similarity: 0.1,
      explanation: `Different campus locations (${formatLabel(locA)} vs ${formatLabel(locB)})`,
    };
  }

  // Adjacent location -> 80%
  if (infoA.adjacent.includes(normB) || infoB.adjacent.includes(normA)) {
    return {
      similarity: 0.8,
      explanation: `Adjacent campus locations (${formatLabel(locA)} and ${formatLabel(locB)})`,
    };
  }

  // Same campus area (parent) -> 50%
  if (infoA.parent === infoB.parent) {
    return {
      similarity: 0.5,
      explanation: `Same campus area (${formatLabel(infoA.parent)})`,
    };
  }

  // Distant location -> 10%
  return {
    similarity: 0.1,
    explanation: `Distant campus locations (${formatLabel(locA)} vs ${formatLabel(locB)})`,
  };
}

/**
 * Calculates time proximity similarity based on soft decay.
 * Returns negative if found before lost, or diffDays > 30.
 */
export function calculateTimeProximity(
  lostDateStr: string,
  foundDateStr: string
): { isCandidate: boolean; diffDays: number; similarity: number; explanation: string } {
  const lostDate = new Date(lostDateStr + "T00:00:00Z");
  const foundDate = new Date(foundDateStr + "T00:00:00Z");

  const diffMs = foundDate.getTime() - lostDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isCandidate: false,
      diffDays,
      similarity: 0,
      explanation: `Item was reported found ${Math.abs(diffDays)} day(s) before it was reported lost`,
    };
  }

  if (diffDays > 30) {
    return {
      isCandidate: false,
      diffDays,
      similarity: 0,
      explanation: `Exceeds the 30-day candidate matching window (${diffDays} days apart)`,
    };
  }

  // Soft time decay tiers:
  let similarity = 0.1;
  let label = `${diffDays} days apart`;

  if (diffDays === 0) {
    similarity = 1.0;
    label = "Reported lost and found on the same day";
  } else if (diffDays === 1) {
    similarity = 0.9;
    label = "Found 1 day after reported lost";
  } else if (diffDays === 2) {
    similarity = 0.8;
    label = "Found 2 days after reported lost";
  } else if (diffDays >= 3 && diffDays <= 5) {
    similarity = 0.65;
    label = `Close reporting dates (${diffDays} days apart)`;
  } else if (diffDays >= 6 && diffDays <= 10) {
    similarity = 0.4;
    label = `Reporting dates within 10 days (${diffDays} days apart)`;
  } else if (diffDays >= 11 && diffDays <= 14) {
    similarity = 0.2;
    label = `Reporting dates within two weeks (${diffDays} days apart)`;
  } else {
    // 15 - 30 days
    similarity = 0.1;
    label = `Reporting dates separated by ${diffDays} days`;
  }

  return {
    isCandidate: true,
    diffDays,
    similarity,
    explanation: label,
  };
}

/**
 * Calculates color similarity between 0.0 and 1.0 using color groups.
 * If either color is missing, returns available: false.
 */
export function calculateColorSimilarity(
  colorA?: string | null,
  colorB?: string | null
): { available: boolean; similarity: number; explanation: string } {
  if (!colorA || !colorB || colorA.trim() === "" || colorB.trim() === "") {
    return {
      available: false,
      similarity: 0,
      explanation: "Color information was not provided",
    };
  }

  const cA = colorA.trim().toLowerCase();
  const cB = colorB.trim().toLowerCase();

  // Exact match
  if (cA === cB) {
    return {
      available: true,
      similarity: 1.0,
      explanation: `Identical color descriptions (${formatLabel(cA)})`,
    };
  }

  // Check synonym groups
  const findGroup = (col: string): string | null => {
    for (const [groupName, synonyms] of Object.entries(colorGroups)) {
      if (groupName === col || synonyms.includes(col)) {
        return groupName;
      }
    }
    return null;
  };

  const groupA = findGroup(cA);
  const groupB = findGroup(cB);

  if (groupA && groupB && groupA === groupB) {
    return {
      available: true,
      similarity: 1.0,
      explanation: `Matching color group (${formatLabel(groupA)}: ${cA} / ${cB})`,
    };
  }

  // Dark vs Black heuristic (60% similarity as specified in spec)
  const isDarkA = cA === "dark";
  const isDarkB = cB === "dark";
  const isBlackA = groupA === "black" || cA === "black";
  const isBlackB = groupB === "black" || cB === "black";

  if ((isDarkA && isBlackB) || (isDarkB && isBlackA)) {
    return {
      available: true,
      similarity: 0.6,
      explanation: "Weak color similarity (Dark vs Black)",
    };
  }

  // Different color
  return {
    available: true,
    similarity: 0.0,
    explanation: `Different colors reported (${formatLabel(cA)} vs ${formatLabel(cB)})`,
  };
}

/**
 * Full match comparison between a lost report and a found report.
 */
export function scoreMatch(lost: ReportItem, found: ReportItem): MatchScoreResult {
  // Step 1: Candidate filtering
  // 1. Only open reports considered
  if (lost.status !== "open" || found.status !== "open") {
    return rejectResult("One or both reports are not open");
  }

  // 2. Found item cannot be before lost date & 30-day candidate window
  const timeResult = calculateTimeProximity(lost.event_date, found.event_date);
  if (!timeResult.isCandidate) {
    return rejectResult(timeResult.explanation);
  }

  // 3. Category compatibility
  const categoryResult = evaluateCategoryCompatibility(
    lost.subcategory,
    found.subcategory,
    lost.category,
    found.category
  );
  if (!categoryResult.compatible) {
    return rejectResult(categoryResult.explanation);
  }

  // Step 2 & 3: Component Scoring
  // Category (weight 30)
  const catBreakdown: ComponentBreakdown = {
    name: "Category",
    weight: WEIGHTS.category,
    available: true,
    similarity: categoryResult.similarity,
    contribution: WEIGHTS.category * categoryResult.similarity,
    explanation: categoryResult.explanation,
  };

  // Distinctive Attributes (weight 25)
  const attrResult = calculateAttributeSimilarity(lost, found);
  const attrBreakdown: ComponentBreakdown = {
    name: "Attributes",
    weight: WEIGHTS.attributes,
    available: true,
    similarity: attrResult.similarity,
    contribution: WEIGHTS.attributes * attrResult.similarity,
    explanation: attrResult.explanation,
  };

  // Location Proximity (weight 20)
  const locResult = calculateLocationSimilarity(lost.location, found.location);
  const locBreakdown: ComponentBreakdown = {
    name: "Location",
    weight: WEIGHTS.location,
    available: true,
    similarity: locResult.similarity,
    contribution: WEIGHTS.location * locResult.similarity,
    explanation: locResult.explanation,
  };

  // Time Proximity (weight 15)
  const timeBreakdown: ComponentBreakdown = {
    name: "Time",
    weight: WEIGHTS.time,
    available: true,
    similarity: timeResult.similarity,
    contribution: WEIGHTS.time * timeResult.similarity,
    explanation: timeResult.explanation,
  };

  // Color Similarity (weight 10)
  const colorResult = calculateColorSimilarity(lost.color, found.color);
  const colorBreakdown: ComponentBreakdown = {
    name: "Color",
    weight: WEIGHTS.color,
    available: colorResult.available,
    similarity: colorResult.available ? colorResult.similarity : 0,
    contribution: colorResult.available ? WEIGHTS.color * colorResult.similarity : 0,
    explanation: colorResult.explanation,
  };

  const components = [catBreakdown, attrBreakdown, locBreakdown, timeBreakdown, colorBreakdown];

  // Step 4: Missing information and coverage
  // S = sum_{i in A} (w_i * s_i) / sum_{i in A} (w_i) * 100
  // C = sum_{i in A} (w_i) / 100 * 100
  let availableWeightSum = 0;
  let weightedSimilaritySum = 0;

  for (const comp of components) {
    if (comp.available) {
      availableWeightSum += comp.weight;
      weightedSimilaritySum += comp.weight * comp.similarity;
    }
  }

  const rawScore = availableWeightSum > 0 ? (weightedSimilaritySum / availableWeightSum) * 100 : 0;
  const score = Math.round(rawScore);
  const coverage = Math.round((availableWeightSum / 100) * 100);

  // Step 5: Match classification (aligned with entity resolution research)
  // Strong: Score >= 70 and coverage >= 60%
  // Possible: Score >= 60 but not Strong (or Score >= 70 with coverage < 60%)
  // Weak: Score < 60
  let classification: MatchClassification = "Weak";
  if (score >= 70 && coverage >= 60) {
    classification = "Strong";
  } else if (score >= 60) {
    classification = "Possible";
  } else {
    classification = "Weak";
  }

  // Compile explanations
  const explanations: string[] = [
    categoryResult.explanation,
    locResult.explanation,
    timeResult.explanation,
    attrResult.explanation,
  ];

  if (colorResult.available) {
    explanations.push(colorResult.explanation);
  } else {
    explanations.push("Color information was incomplete (coverage adjusted to " + coverage + "%)");
  }

  return {
    isCandidate: true,
    score,
    coverage,
    classification,
    explanations,
    components: {
      category: catBreakdown,
      attributes: attrBreakdown,
      location: locBreakdown,
      time: timeBreakdown,
      color: colorBreakdown,
    },
  };
}

function rejectResult(reason: string): MatchScoreResult {
  return {
    isCandidate: false,
    rejectionReason: reason,
    score: 0,
    coverage: 0,
    classification: "Weak",
    explanations: [reason],
    components: {
      category: { name: "Category", weight: WEIGHTS.category, available: false, similarity: 0, contribution: 0, explanation: reason },
      attributes: { name: "Attributes", weight: WEIGHTS.attributes, available: false, similarity: 0, contribution: 0, explanation: "N/A" },
      location: { name: "Location", weight: WEIGHTS.location, available: false, similarity: 0, contribution: 0, explanation: "N/A" },
      time: { name: "Time", weight: WEIGHTS.time, available: false, similarity: 0, contribution: 0, explanation: "N/A" },
      color: { name: "Color", weight: WEIGHTS.color, available: false, similarity: 0, contribution: 0, explanation: "N/A" },
    },
  };
}

function formatLabel(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
