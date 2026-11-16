import { Report, CreateReportFormData, MatchPair, MetadataResponse } from "../types";

const API_BASE = "/api";

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) throw new Error("Failed to load metadata taxonomy");
  return res.json();
}

export async function fetchReports(params?: {
  type?: "lost" | "found";
  status?: "open" | "claimed" | "closed";
}): Promise<Report[]> {
  const query = new URLSearchParams();
  if (params?.type) query.append("type", params.type);
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function createReport(data: CreateReportFormData): Promise<Report> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to submit report");
  }
  return res.json();
}

export async function fetchMatches(params?: {
  reportId?: number;
  minClassification?: "Strong" | "Possible" | "All";
}): Promise<MatchPair[]> {
  const query = new URLSearchParams();
  if (params?.reportId) query.append("reportId", params.reportId.toString());
  if (params?.minClassification) query.append("minClassification", params.minClassification);

  const res = await fetch(`${API_BASE}/matches?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to calculate matches");
  return res.json();
}

export async function dismissMatch(lostReportId: number, foundReportId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/matches/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lost_report_id: lostReportId,
      found_report_id: foundReportId,
    }),
  });
  if (!res.ok) throw new Error("Failed to dismiss match");
}

export async function confirmMatch(
  lostReportId: number,
  foundReportId: number
): Promise<{ success: boolean; lostReport: Report; foundReport: Report }> {
  const res = await fetch(`${API_BASE}/matches/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lost_report_id: lostReportId,
      found_report_id: foundReportId,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to confirm match");
  }
  return res.json();
}

export async function updateReportStatus(
  reportId: number,
  status: "open" | "claimed" | "closed"
): Promise<Report> {
  const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update report status");
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset database");
}
