"use client";

import React from "react";
import { Search, SlidersHorizontal, RotateCcw, Globe } from "lucide-react";
import { ApplicationStatus, JobSource } from "@/types/job";

export interface FilterState {
  search: string;
  status: string;
  source: string;
  minScore: string;
  remoteOnly: boolean;
  worldwideOnly: boolean;
  sort: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Saved", value: "SAVED" },
  { label: "To Apply", value: "APPLY" },
  { label: "Applied", value: "APPLIED" },
  { label: "Interview", value: "INTERVIEW" },
  { label: "Tech Interview", value: "TECHNICAL_INTERVIEW" },
  { label: "Final Interview", value: "FINAL_INTERVIEW" },
  { label: "Offer", value: "OFFER" },
  { label: "Selected", value: "SELECTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Withdrawn", value: "WITHDRAWN" },
];

const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Sources", value: "ALL" },
  { label: "Himalayas", value: "Himalayas" },
  { label: "Remotive", value: "Remotive" },
  { label: "Jobicy", value: "Jobicy" },
  { label: "RemoteJobs.org", value: "RemoteJobsOrg" },
  { label: "Remote Landers", value: "RemoteLanders" },
  { label: "Arbeitnow", value: "Arbeitnow" },
  { label: "We Work Remotely", value: "WeWorkRemotely" },
  { label: "Remote OK", value: "RemoteOK" },
  { label: "Working Nomads", value: "WorkingNomads" },
  { label: "LaraJobs", value: "LaraJobs" },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Highest Match Score", value: "highest_score" },
  { label: "Lowest Match Score", value: "lowest_score" },
  { label: "Company (A-Z)", value: "company" },
  { label: "Job Title (A-Z)", value: "title" },
  { label: "Status", value: "status" },
];

const WORKPLACE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Workplaces", value: "ALL" },
  { label: "Remote Only", value: "REMOTE" },
  { label: "🌐 Open Worldwide", value: "WORLDWIDE" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by title, company, location, or source..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status select */}
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Source select */}
          <select
            value={filters.source}
            onChange={(e) => onChange({ ...filters, source: e.target.value })}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Match Score */}
          <select
            value={filters.minScore}
            onChange={(e) => onChange({ ...filters, minScore: e.target.value })}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Match Scores</option>
            <option value="80">80%+ (Top Match)</option>
            <option value="60">60%+ (Good Match)</option>
            <option value="40">40%+ (Moderate)</option>
          </select>

          {/* Workplace / Remote Select */}
          <select
            value={filters.worldwideOnly ? "WORLDWIDE" : filters.remoteOnly ? "REMOTE" : "ALL"}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                ...filters,
                remoteOnly: val === "REMOTE" || val === "WORLDWIDE",
                worldwideOnly: val === "WORLDWIDE",
              });
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {WORKPLACE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Open Worldwide Remote Checkbox */}
          <label
            title="Show only jobs open to applicants worldwide (no geo-restrictions)"
            className={`inline-flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
              filters.worldwideOnly
                ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900"
            }`}
          >
            <input
              type="checkbox"
              checked={filters.worldwideOnly}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({
                  ...filters,
                  worldwideOnly: checked,
                  remoteOnly: checked ? true : filters.remoteOnly,
                });
              }}
              className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
            />
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Worldwide</span>
          </label>

          {/* Remote Only Toggle */}
          <label className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={filters.remoteOnly}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({
                  ...filters,
                  remoteOnly: checked,
                  worldwideOnly: !checked ? false : filters.worldwideOnly,
                });
              }}
              className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
            />
            <span>Remote Only</span>
          </label>

          {/* Sort */}
          <div className="flex items-center space-x-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value })}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
