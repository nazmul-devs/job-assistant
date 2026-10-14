"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ApplicationStatus } from "@/types/job";

interface CleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanupSuccess: (deletedCount: number) => void;
}

const AGE_OPTIONS = [
  { label: "Older than 2 days", value: 2 },
  { label: "Older than 7 days (1 week)", value: 7 },
  { label: "Older than 14 days (2 weeks)", value: 14 },
  { label: "Older than 30 days (1 month)", value: 30 },
  { label: "Older than 60 days (2 months)", value: 60 },
  { label: "All Previous Jobs (No date cutoff)", value: 0 },
];

export const CleanupModal: React.FC<CleanupModalProps> = ({
  isOpen,
  onClose,
  onCleanupSuccess,
}) => {
  const [olderThanDays, setOlderThanDays] = useState<number>(7);
  const [deleteNew, setDeleteNew] = useState<boolean>(true);
  const [deleteRejected, setDeleteRejected] = useState<boolean>(true);
  const [deleteWithdrawn, setDeleteWithdrawn] = useState<boolean>(true);
  const [keepActiveApplications, setKeepActiveApplications] = useState<boolean>(true);

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [sampleJobs, setSampleJobs] = useState<
    Array<{ id: string; title: string; company: string; source: string; status: string }>
  >([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Compute selected statuses
  const getSelectedStatuses = useCallback((): ApplicationStatus[] => {
    const list: ApplicationStatus[] = [];
    if (deleteNew) list.push("NEW");
    if (deleteRejected) list.push("REJECTED");
    if (deleteWithdrawn) list.push("WITHDRAWN");
    return list;
  }, [deleteNew, deleteRejected, deleteWithdrawn]);

  // Fetch preview count
  const fetchPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setResultMessage(null);
    try {
      const statuses = getSelectedStatuses();
      const res = await fetch("/api/jobs/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          olderThanDays,
          statuses,
          keepActiveApplications,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewCount(data.count);
        setSampleJobs(data.sample || []);
      } else {
        setPreviewCount(0);
        setSampleJobs([]);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
      setPreviewCount(0);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [olderThanDays, getSelectedStatuses, keepActiveApplications]);

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setResultMessage(null);
      fetchPreview();
    }
  }, [isOpen, fetchPreview]);

  if (!isOpen) return null;

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    setResultMessage(null);
    try {
      const statuses = getSelectedStatuses();
      const res = await fetch("/api/jobs/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          olderThanDays,
          statuses,
          keepActiveApplications,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMessage(`Successfully deleted ${data.count} old job(s).`);
        onCleanupSuccess(data.count);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setResultMessage(data.error || "Failed to delete jobs");
      }
    } catch (err) {
      setResultMessage(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Clean & Delete Previous Jobs</h2>
              <p className="text-xs text-slate-400">
                Purge stale job records to declutter your dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Safeguard Notice */}
          <div className="flex items-start space-x-3 p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-emerald-200">
                Safe Clean Active Protection
              </div>
              <div>
                Jobs marked as <strong className="text-white">Saved, To Apply, Applied, Interview</strong>, or <strong className="text-white">Offer</strong> will be safely kept and never deleted.
              </div>
            </div>
          </div>

          {/* Age Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Jobs Age Threshold</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOlderThanDays(opt.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer ${
                    olderThanDays === opt.value
                      ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-sm shadow-rose-900/30 font-semibold"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Select Job Categories to Clean
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <label className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={deleteNew}
                  onChange={(e) => setDeleteNew(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>New / Unapplied Jobs</span>
              </label>

              <label className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={deleteRejected}
                  onChange={(e) => setDeleteRejected(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>Rejected Jobs</span>
              </label>

              <label className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer hover:bg-slate-850">
                <input
                  type="checkbox"
                  checked={deleteWithdrawn}
                  onChange={(e) => setDeleteWithdrawn(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800"
                />
                <span>Withdrawn Jobs</span>
              </label>
            </div>
          </div>

          {/* Keep Active Toggle */}
          <label className="inline-flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepActiveApplications}
              onChange={(e) => setKeepActiveApplications(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
            />
            <span>Protect saved & applied jobs from accidental deletion (Recommended)</span>
          </label>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Matching Jobs to Delete:</span>
              <div className="flex items-center space-x-2">
                {isLoadingPreview ? (
                  <span className="inline-flex items-center space-x-1 text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </span>
                ) : (
                  <span className="font-bold text-rose-400 text-sm">
                    {previewCount !== null ? previewCount.toLocaleString() : 0} jobs
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchPreview}
                  title="Refresh count"
                  className="p-1 hover:text-white text-slate-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {sampleJobs.length > 0 && (
              <div className="pt-2 border-t border-slate-900 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Sample jobs:</span>
                <ul className="text-xs text-slate-300 space-y-0.5 truncate">
                  {sampleJobs.slice(0, 3).map((j) => (
                    <li key={j.id} className="truncate text-slate-400">
                      • <span className="text-slate-200">{j.title}</span> at {j.company} ({j.source})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Result Alert */}
          {resultMessage && (
            <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {!confirmed ? (
            <button
              type="button"
              disabled={isLoadingPreview || isDeleting || previewCount === 0}
              onClick={() => setConfirmed(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {previewCount !== null ? previewCount : 0} Jobs...</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setConfirmed(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-700/40 transition-all cursor-pointer animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Confirm & Permanently Delete"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
