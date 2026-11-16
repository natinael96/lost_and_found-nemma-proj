export interface Report {
  id: number;
  type: "lost" | "found";
  title: string;
  category: string;
  subcategory: string;
  color?: string | null;
  location: string;
  event_date: string;
  event_time?: string | null;
  brand?: string | null;
  description?: string | null;
  distinguishing_features?: string | null;
  status: "open" | "claimed" | "closed";
  created_at: string;
}

export interface CreateReportFormData {
  type: "lost" | "found";
  title: string;
  category: string;
  subcategory: string;
  color?: string;
  location: string;
  event_date: string;
  event_time?: string;
  brand?: string;
  description?: string;
  distinguishing_features?: string;
}

export interface ComponentBreakdown {
  name: string;
  weight: number;
  available: boolean;
  similarity: number;
  contribution: number;
  explanation: string;
}

export interface MatchScoreResult {
  isCandidate: boolean;
  rejectionReason?: string;
  score: number;
  coverage: number;
  classification: "Strong" | "Possible" | "Weak";
  explanations: string[];
  components: {
    category: ComponentBreakdown;
    attributes: ComponentBreakdown;
    location: ComponentBreakdown;
    time: ComponentBreakdown;
    color: ComponentBreakdown;
  };
}

export interface MatchPair {
  lostReport: Report;
  foundReport: Report;
  match: MatchScoreResult;
}

export interface MetadataResponse {
  categories: Record<string, Record<string, string[]>>;
  campusLocations: Record<string, { parent: string; adjacent: string[] }>;
  colorGroups: Record<string, string[]>;
}
