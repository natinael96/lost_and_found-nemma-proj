import React, { useState } from "react";
import { Report } from "../types";
import { MapPin, Calendar } from "lucide-react";

interface ReportListProps {
  reports: Report[];
  onStatusChange: (id: number, status: "open" | "claimed" | "closed") => Promise<void>;
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onStatusChange }) => {
  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "claimed">("all");

  const filtered = reports.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Filter Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900">All Registered Reports</h2>
          <p className="text-xs text-slate-500">
            Browse active and historical lost &amp; found submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "lost" | "found")}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="all">All Types</option>
            <option value="lost">Lost Only</option>
            <option value="found">Found Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "claimed")}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">ID / Type</th>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location &amp; Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No reports found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-slate-500 mr-1.5 font-medium">#{r.id}</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                        r.type === "lost"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                    <div>{r.title}</div>
                    {r.brand && <div className="text-[11px] text-slate-500">Brand: {r.brand}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-slate-800">{formatLabel(r.subcategory)}</div>
                    <div className="text-[10px] text-slate-500">{formatLabel(r.category)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {formatLabel(r.location)}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {r.event_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        r.status === "open"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {r.status === "open" ? (
                      <button
                        onClick={() => onStatusChange(r.id, "claimed")}
                        className="min-h-[44px] px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        Mark Claimed
                      </button>
                    ) : (
                      <button
                        onClick={() => onStatusChange(r.id, "open")}
                        className="min-h-[44px] px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-300 transition focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatLabel(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
