import React, { useState, useEffect, useCallback } from "react";
import { Report, MatchPair, MetadataResponse, CreateReportFormData } from "../types";
import {
  fetchReports,
  fetchMatches,
  fetchMetadata,
  createReport,
  dismissMatch,
  confirmMatch,
  updateReportStatus,
  resetDatabase,
} from "../services/api";
import { DashboardStats } from "../components/DashboardStats";
import { MatchList } from "../components/MatchList";
import { ReportForm } from "../components/ReportForm";
import { ReportList } from "../components/ReportList";
import { GitCompare, PlusCircle, ListChecks, CheckCircle } from "lucide-react";

export const Dashboard: React.FC = () => {
  const getInitialTab = (): "matches" | "submit" | "reports" => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "submit" || tab === "reports") return tab;
      const hash = window.location.hash.replace("#", "");
      if (hash === "submit" || hash === "reports") return hash as "submit" | "reports";
    }
    return "matches";
  };

  const [reports, setReports] = useState<Report[]>([]);
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "submit" | "reports">(getInitialTab);
  const [submitType, setSubmitType] = useState<"lost" | "found">("lost");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tab: "matches" | "submit" | "reports") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "matches") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoadingMatches(true);
      const [fetchedReports, fetchedMatches, meta] = await Promise.all([
        fetchReports(),
        fetchMatches(),
        metadata ? Promise.resolve(metadata) : fetchMetadata(),
      ]);
      setReports(fetchedReports);
      setMatches(fetchedMatches);
      if (!metadata) setMetadata(meta);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [metadata]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle report submission
  const handleCreateReport = async (data: CreateReportFormData) => {
    await createReport(data);
    showToast(`New ${data.type} report created successfully!`);
    await loadData();
    setActiveTab("matches");
  };

  // Handle confirming a match atomically
  const handleConfirmMatch = async (lostId: number, foundId: number) => {
    try {
      await confirmMatch(lostId, foundId);
      showToast("Match confirmed! Both reports are now marked as claimed.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm match.";
      showToast(`Error: ${msg}`);
    }
  };

  // Handle dismissing a match
  const handleDismissMatch = async (lostId: number, foundId: number) => {
    try {
      await dismissMatch(lostId, foundId);
      showToast("Match dismissed. This suggestion pair will not be shown again.");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dismiss match.";
      showToast(`Error: ${msg}`);
    }
  };

  // Handle single report status update
  const handleStatusChange = async (id: number, status: "open" | "claimed" | "closed") => {
    await updateReportStatus(id, status);
    showToast(`Report #${id} status updated to ${status}.`);
    await loadData();
  };

  // Handle reset to sample dataset
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();
      showToast("Database reset to sample state with 7 benchmark test cases!");
      await loadData();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Computed summary metrics
  const totalLost = reports.filter((r) => r.type === "lost").length;
  const totalFound = reports.filter((r) => r.type === "found").length;
  const openReports = reports.filter((r) => r.status === "open").length;
  const potentialMatches = matches.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 transition-all duration-300 ease-out transform translate-y-0 motion-reduce:transition-none"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Metrics */}
      <DashboardStats
        totalLost={totalLost}
        totalFound={totalFound}
        openReports={openReports}
        potentialMatches={potentialMatches}
        onResetDatabase={handleReset}
        isResetting={isResetting}
      />

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Dashboard sections" className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          role="tab"
          id="tab-matches"
          aria-selected={activeTab === "matches"}
          aria-controls="panel-matches"
          onClick={() => handleTabChange("matches")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            activeTab === "matches"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Potential Matches</span>
          {potentialMatches > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {potentialMatches}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-submit"
          aria-selected={activeTab === "submit"}
          aria-controls="panel-submit"
          onClick={() => handleTabChange("submit")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            activeTab === "submit"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Report</span>
        </button>

        <button
          role="tab"
          id="tab-reports"
          aria-selected={activeTab === "reports"}
          aria-controls="panel-reports"
          onClick={() => handleTabChange("reports")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            activeTab === "reports"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Reports Directory</span>
          <span className="ml-1 text-xs text-slate-500">({reports.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "matches" && (
        <div role="tabpanel" id="panel-matches" aria-labelledby="tab-matches">
          <MatchList
            matches={matches}
            isLoading={isLoadingMatches}
            onConfirmMatch={handleConfirmMatch}
            onDismissMatch={handleDismissMatch}
          />
        </div>
      )}

      {activeTab === "submit" && (
        <div role="tabpanel" id="panel-submit" aria-labelledby="tab-submit" className="space-y-4">
          {/* Sub-selector for Lost vs Found Form */}
          <div role="group" aria-label="Report type selection" className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-xl w-fit">
            <button
              type="button"
              aria-pressed={submitType === "lost"}
              onClick={() => setSubmitType("lost")}
              className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-lg transition ${
                submitType === "lost"
                  ? "bg-white text-amber-800 shadow-sm"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              I Lost Something
            </button>
            <button
              type="button"
              aria-pressed={submitType === "found"}
              onClick={() => setSubmitType("found")}
              className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-lg transition ${
                submitType === "found"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              I Found Something
            </button>
          </div>

          <ReportForm
            type={submitType}
            metadata={metadata}
            onSubmit={handleCreateReport}
          />
        </div>
      )}

      {activeTab === "reports" && (
        <div role="tabpanel" id="panel-reports" aria-labelledby="tab-reports">
          <ReportList reports={reports} onStatusChange={handleStatusChange} />
        </div>
      )}
    </div>
  );
};
