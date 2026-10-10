"use client";

import React from "react";
import {
  ExternalLink,
  MapPin,
  Building,
  Calendar,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";
import { ApplicationStatus, MatchDetails } from "@/types/job";

export interface JobItem {
  id: string;
  source: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location?: string | null;
  isRemote: boolean;
  salary?: string | null;
  jobUrl: string;
  applyUrl: string;
  postedAt?: string | null;
  matchScore: number;
  matchDetails?: MatchDetails | null;
  status: ApplicationStatus;
  notes?: string | null;
  interviewDate?: string | null;
  appliedAt?: string | null;
}

interface JobsTableProps {
  jobs: JobItem[];
  isLoading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
  onPageChange: (newPage: number) => void;
  onStatusChange: (jobId: string, newStatus: ApplicationStatus) => void;
  onViewDetails: (job: JobItem) => void;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  NEW: { label: "New", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  SAVED: { label: "Saved", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  APPLY: { label: "To Apply", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  APPLIED: { label: "Applied", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  INTERVIEW: { label: "Interview", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  TECHNICAL_INTERVIEW: { label: "Tech Interview", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  FINAL_INTERVIEW: { label: "Final Interview", bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
  OFFER: { label: "Offer", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  SELECTED: { label: "Selected", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  REJECTED: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  WITHDRAWN: { label: "Withdrawn", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

const ALL_STATUS_OPTIONS: ApplicationStatus[] = [
  "NEW",
  "SAVED",
  "APPLY",
  "APPLIED",
  "INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

const SOURCE_COLORS: Record<string, string> = {
  Himalayas: "bg-indigo-950/60 text-indigo-300 border-indigo-700/50",
  Remotive: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
  Jobicy: "bg-amber-950/60 text-amber-300 border-amber-700/50",
  RemoteJobsOrg: "bg-cyan-950/60 text-cyan-300 border-cyan-700/50",
  RemoteLanders: "bg-purple-950/60 text-purple-300 border-purple-700/50",
  Arbeitnow: "bg-pink-950/60 text-pink-300 border-pink-700/50",
  WeWorkRemotely: "bg-red-950/60 text-red-300 border-red-700/50",
  RemoteOK: "bg-sky-950/60 text-sky-300 border-sky-700/50",
  WorkingNomads: "bg-teal-950/60 text-teal-300 border-teal-700/50",
  LaraJobs: "bg-rose-950/60 text-rose-300 border-rose-700/50",
};

export const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  isLoading,
  pagination,
  onPageChange,
  onStatusChange,
  onViewDetails,
}) => {
  const getScoreBadge = (score: number) => {
    if (score >= 75) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (score >= 50) {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recent";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3" />
        <p className="text-slate-400 text-sm">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-12 text-center">
        <Sparkles className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">No jobs found</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Try adjusting your search criteria, lowering the match threshold, or click &quot;Sync Jobs&quot; to fetch fresh listings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Job Title & Company</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-center">Match</th>
              <th className="py-3.5 px-4">Salary</th>
              <th className="py-3.5 px-4">Source</th>
              <th className="py-3.5 px-4">Posted</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm text-slate-200">
            {jobs.map((job) => {
              const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.NEW;
              const sourceBadgeColor = SOURCE_COLORS[job.source] || "bg-slate-800 text-slate-300 border-slate-700";

              return (
                <tr
                  key={job.id}
                  className="hover:bg-slate-850/60 transition-colors group"
                >
                  {/* Job Title & Company */}
                  <td className="py-3.5 px-4 max-w-xs md:max-w-md lg:max-w-lg">
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {job.title}
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                  </td>

                  {/* Location & Remote */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px] lg:max-w-[220px]">{job.location || "Remote"}</span>
                    </div>
                    {job.isRemote && (
                      <span
                        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 text-[10px] font-medium rounded mt-1 border ${
                          job.location &&
                          (job.location.toLowerCase().includes("worldwide") ||
                            job.location.toLowerCase().includes("anywhere") ||
                            job.location.toLowerCase().includes("global") ||
                            job.location.toLowerCase() === "remote")
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        <Globe2 className="w-2.5 h-2.5" />
                        <span>
                          {job.location &&
                          (job.location.toLowerCase().includes("worldwide") ||
                            job.location.toLowerCase().includes("anywhere") ||
                            job.location.toLowerCase().includes("global"))
                            ? "Worldwide Remote"
                            : "Remote"}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Match Score */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center font-bold px-2.5 py-1 text-xs rounded-full border ${getScoreBadge(
                        job.matchScore
                      )}`}
                    >
                      {job.matchScore}%
                    </span>
                  </td>

                  {/* Salary */}
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-300 whitespace-nowrap">
                    {job.salary ? (
                      <span className="text-emerald-400">{job.salary}</span>
                    ) : (
                      <span className="text-slate-500 italic">Competitive</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${sourceBadgeColor}`}
                    >
                      {job.source}
                    </span>
                  </td>

                  {/* Posted Date */}
                  <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(job.postedAt)}</span>
                    </div>
                  </td>

                  {/* Application Status Selector */}
                  <td className="py-3.5 px-4">
                    <select
                      value={job.status}
                      onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      {ALL_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st} className="bg-slate-900 text-slate-200">
                          {STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions & Apply Button */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewDetails(job)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                        title="View Full Details & Timeline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <a
                        href={job.applyUrl || job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                        title="Open Original Application in New Tab"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-950/60 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Showing page <span className="font-semibold text-white">{pagination.page}</span> of{" "}
          <span className="font-semibold text-white">{Math.max(1, pagination.totalPages)}</span> ({pagination.totalCount.toLocaleString()} total jobs)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
