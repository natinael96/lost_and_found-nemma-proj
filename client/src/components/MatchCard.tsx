import React, { useState } from "react";
import { MatchPair } from "../types";
import {
  Check,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MatchCardProps {
  pair: MatchPair;
  onConfirmMatch: (lostId: number, foundId: number) => Promise<void>;
  onDismissMatch: (lostId: number, foundId: number) => Promise<void>;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  pair,
  onConfirmMatch,
  onDismissMatch,
}) => {
  const { lostReport, foundReport, match } = pair;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "Strong":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Possible":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("Confirm this match? Both reports will be marked as claimed.")) return;
    setIsConfirming(true);
    try {
      await onConfirmMatch(lostReport.id, foundReport.id);
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await onDismissMatch(lostReport.id, foundReport.id);
    } catch (err) {
      console.error("Dismissal error:", err);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition overflow-hidden">
      {/* Top Header: Comparison Titles, Classification, Coverage & Score */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${getClassificationBadge(
                match.classification
              )}`}
            >
              {match.classification} Candidate
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Data Coverage: <strong className="text-slate-800">{match.coverage}%</strong>
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{lostReport.title}</span>
            <span className="text-slate-400 font-normal text-sm">vs</span>
            <span>{foundReport.title}</span>
          </h3>
        </div>

        {/* Authoritative Score Indicator */}
        <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-5">
          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Similarity</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {match.score}
              </span>
              <span className="text-xs font-bold text-slate-500">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison (Clean Two-Column Grid without Nested Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-b border-slate-100 bg-slate-50/30">
        {/* Lost Report Column */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Lost Report #{lostReport.id}
            </span>
            <span className="text-xs text-slate-500 font-medium">{lostReport.event_date}</span>
          </div>

          <div className="font-semibold text-slate-900 text-sm">{lostReport.title}</div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Category</span>
              <span className="font-medium text-slate-900">{formatLabel(lostReport.subcategory)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Location</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {formatLabel(lostReport.location)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Color</span>
              <span className="font-medium text-slate-900">
                {lostReport.color ? formatLabel(lostReport.color) : <em className="text-slate-500 font-normal">Not specified</em>}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Brand</span>
              <span className="font-medium text-slate-900">
                {lostReport.brand || <em className="text-slate-500 font-normal">Not specified</em>}
              </span>
            </div>
          </div>

          {lostReport.description && (
            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 italic">
              &ldquo;{lostReport.description}&rdquo;
            </p>
          )}

          {lostReport.distinguishing_features && (
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-semibold">Features:</strong> {lostReport.distinguishing_features}
            </div>
          )}
        </div>

        {/* Found Report Column */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Found Report #{foundReport.id}
            </span>
            <span className="text-xs text-slate-500 font-medium">{foundReport.event_date}</span>
          </div>

          <div className="font-semibold text-slate-900 text-sm">{foundReport.title}</div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Category</span>
              <span className="font-medium text-slate-900">{formatLabel(foundReport.subcategory)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Location</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {formatLabel(foundReport.location)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Color</span>
              <span className="font-medium text-slate-900">
                {foundReport.color ? formatLabel(foundReport.color) : <em className="text-slate-500 font-normal">Not specified</em>}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Brand</span>
              <span className="font-medium text-slate-900">
                {foundReport.brand || <em className="text-slate-500 font-normal">Not specified</em>}
              </span>
            </div>
          </div>

          {foundReport.description && (
            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 italic">
              &ldquo;{foundReport.description}&rdquo;
            </p>
          )}

          {foundReport.distinguishing_features && (
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-semibold">Features:</strong> {foundReport.distinguishing_features}
            </div>
          )}
        </div>
      </div>

      {/* Match Justification & Explainable Reasoning */}
      <div className="p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
          Match Reasoning
        </h4>

        <ul className="space-y-2 mb-4">
          {match.explanations.map((exp, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{exp}</span>
            </li>
          ))}
        </ul>

        {/* Detailed Component Breakdown Toggle */}
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 mb-3 transition focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {showBreakdown ? (
            <>
              Hide scoring breakdown <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View weighted component breakdown <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {showBreakdown && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800 mb-2">Heuristic Component Weighting:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {Object.values(match.components).map((comp) => (
                <div key={comp.name} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span>{comp.name}</span>
                    <span className="text-slate-500 font-normal">{comp.weight} pts</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                    {comp.available ? `${Math.round(comp.similarity * 100)}%` : <span className="text-slate-500 text-xs font-normal">N/A</span>}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5 truncate" title={comp.explanation}>
                    {comp.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Confirm Match & Not a Match */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isDismissing || isConfirming}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="w-4 h-4" />
            {isDismissing ? "Dismissing..." : "Not a match"}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming || isDismissing}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 transition focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Check className="w-4 h-4" />
            {isConfirming ? "Confirming..." : "Confirm match"}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatLabel(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
