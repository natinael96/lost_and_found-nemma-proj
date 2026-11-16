import React from "react";
import { Search, PackageCheck, AlertCircle, GitCompare, RotateCcw } from "lucide-react";

interface DashboardStatsProps {
  totalLost: number;
  totalFound: number;
  openReports: number;
  potentialMatches: number;
  onResetDatabase: () => void;
  isResetting: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalLost,
  totalFound,
  openReports,
  potentialMatches,
  onResetDatabase,
  isResetting,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            University Lost &amp; Found
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Campus-wide item tracking and rule-based candidate matching.
          </p>
        </div>
        <div>
          <button
            onClick={onResetDatabase}
            disabled={isResetting}
            className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 transition"
            title="Reset database to sample dataset for reviewer exploration"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-blue-600" : ""}`} />
            {isResetting ? "Resetting..." : "Reset Sample Data"}
          </button>
        </div>
      </div>

      {/* Unified Operational Metrics Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-slate-100 lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Lost Reports */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Lost Reports</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {totalLost}
            </div>
            <p className="text-xs text-slate-500 mt-1">Misplaced by students</p>
          </div>

          {/* Found Reports */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Found Items</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <PackageCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {totalFound}
            </div>
            <p className="text-xs text-slate-500 mt-1">Logged with campus desk</p>
          </div>

          {/* Open Cases */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Open Reports</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {openReports}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting resolution</p>
          </div>

          {/* Match Candidates */}
          <div className="p-4 sm:p-5 bg-blue-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-900">Potential Matches</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-800 flex items-center justify-center">
                <GitCompare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-950 tabular-nums tracking-tight">
              {potentialMatches}
            </div>
            <p className="text-xs text-blue-700 mt-1">Eligible candidate pairs</p>
          </div>
        </div>
      </div>
    </div>
  );
};
