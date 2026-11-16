import React, { useState } from "react";
import { MatchPair } from "../types";
import { MatchCard } from "./MatchCard";
import { GitCompare, Filter, CheckCircle2 } from "lucide-react";

interface MatchListProps {
  matches: MatchPair[];
  isLoading: boolean;
  onConfirmMatch: (lostId: number, foundId: number) => Promise<void>;
  onDismissMatch: (lostId: number, foundId: number) => Promise<void>;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  isLoading,
  onConfirmMatch,
  onDismissMatch,
}) => {
  const [filter, setFilter] = useState<"All" | "Strong" | "Possible">("All");
  const [showWeak, setShowWeak] = useState(false);

  const filteredMatches = matches.filter((pair) => {
    if (!showWeak && pair.match.classification === "Weak") return false;
    if (filter === "Strong") return pair.match.classification === "Strong";
    if (filter === "Possible") return pair.match.classification === "Possible";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Potential Match Candidates</h2>
            <p className="text-xs text-slate-500">
              Ranked by explainable heuristic similarity score.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            type="button"
            aria-pressed={filter === "All"}
            onClick={() => setFilter("All")}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold transition focus-visible:ring-2 focus-visible:ring-blue-500 ${
              filter === "All"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Candidates ({matches.filter((m) => showWeak || m.match.classification !== "Weak").length})
          </button>

          <button
            type="button"
            aria-pressed={filter === "Strong"}
            onClick={() => setFilter("Strong")}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              filter === "Strong"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            Strong ({matches.filter((m) => m.match.classification === "Strong").length})
          </button>

          <button
            type="button"
            aria-pressed={filter === "Possible"}
            onClick={() => setFilter("Possible")}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-semibold transition focus-visible:ring-2 focus-visible:ring-amber-500 ${
              filter === "Possible"
                ? "bg-amber-700 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Possible ({matches.filter((m) => m.match.classification === "Possible").length})
          </button>

          <label className="min-h-[44px] flex items-center gap-2 ml-2 cursor-pointer text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showWeak}
              onChange={(e) => setShowWeak(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Show weak (&lt;60)</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-slate-700">Calculating potential matches...</p>
          <p className="text-xs text-slate-400">Evaluating compatibility across reports</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMatches.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No matching candidates found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {matches.length === 0
              ? "All open lost items currently have no eligible matches, or candidate pairs have been confirmed/dismissed."
              : "No candidates match your current filter settings. Try selecting 'All Candidates' or showing weak matches."}
          </p>
        </div>
      )}

      {/* Matches List */}
      {!isLoading && filteredMatches.length > 0 && (
        <div className="space-y-4">
          {filteredMatches.map((pair) => (
            <MatchCard
              key={`${pair.lostReport.id}_${pair.foundReport.id}`}
              pair={pair}
              onConfirmMatch={onConfirmMatch}
              onDismissMatch={onDismissMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};
