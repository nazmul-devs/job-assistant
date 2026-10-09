"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { Navbar } from "@/components/Navbar";
import { StatsCards, DashboardStats } from "@/components/StatsCards";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { JobsTable, JobItem } from "@/components/JobsTable";
import { JobDetailModal } from "@/components/JobDetailModal";
import { ProfileModal } from "@/components/ProfileModal";
import { ApplicationStatus } from "@/types/job";

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "ALL",
    source: "ALL",
    minScore: "",
    remoteOnly: false,
    worldwideOnly: false,
    sort: "highest_score",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [, startTransition] = useTransition();

  // Load dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // Load jobs with filters
  const fetchJobs = useCallback(
    async (currentFilters: FilterState, pageNum: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentFilters.search) params.set("search", currentFilters.search);
        if (currentFilters.status && currentFilters.status !== "ALL") {
          params.set("status", currentFilters.status);
        }
        if (currentFilters.source && currentFilters.source !== "ALL") {
          params.set("source", currentFilters.source);
        }
        if (currentFilters.minScore) params.set("minScore", currentFilters.minScore);
        if (currentFilters.remoteOnly) params.set("remoteOnly", "true");
        if (currentFilters.worldwideOnly) params.set("worldwideOnly", "true");
        if (currentFilters.sort) params.set("sort", currentFilters.sort);
        params.set("page", String(pageNum));
        params.set("limit", "25");

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          setJobs(json.data.jobs);
          setPagination({
            page: json.data.pagination.page,
            totalPages: json.data.pagination.totalPages,
            totalCount: json.data.pagination.totalCount,
          });
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search / filter fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchJobs(filters, pagination.page);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pagination.page, fetchJobs]);

  // Handle manual sync trigger
  const handleSync = async () => {
    setIsSyncing(true);
    setLastSyncMessage(null);
    setLastSyncError(null);

    try {
      const res = await fetch("/api/jobs/sync", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setLastSyncMessage(
          `Sync complete: Fetched ${json.data.totalFetched} jobs, saved ${json.data.totalSaved} new records across 7 public sources.`
        );
        fetchStats();
        fetchJobs(filters, 1);
      } else {
        setLastSyncError(json.error || "Sync completed with warnings.");
      }
    } catch (err) {
      setLastSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // Status card quick filter
  const handleSelectStatusFilter = (statusId: string) => {
    setFilters((prev) => ({
      ...prev,
      status: statusId,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Change status inline
  const handleStatusChange = async (jobId: string, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Update status & notes from detail modal
  const handleUpdateStatusAndNotes = async (
    jobId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    interviewDate?: string | null
  ) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        notes,
        interviewDate,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: newStatus,
                notes: notes ?? j.notes,
                interviewDate: interviewDate ?? j.interviewDate,
              }
            : j
        )
      );
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({
          ...selectedJob,
          status: newStatus,
          notes: notes ?? selectedJob.notes,
          interviewDate: interviewDate ?? selectedJob.interviewDate,
        });
      }
      fetchStats();
    }
  };

  const handleViewDetails = (job: JobItem) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenProfile={() => setIsProfileOpen(true)}
        lastSyncMessage={lastSyncMessage}
        lastSyncError={lastSyncError}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-slate-900 gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Application Tracker Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Aggregated from Himalayas, Remotive, Jobicy, RemoteJobs.org, Remote Landers, Arbeitnow, We Work Remotely, Remote OK, Working Nomads & LaraJobs.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Rules-based candidate matching active</span>
          </div>
        </div>

        {/* Metric Cards */}
        <StatsCards
          stats={stats}
          activeStatusFilter={filters.status}
          onSelectFilter={handleSelectStatusFilter}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onChange={(newF) => {
            setFilters(newF);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onReset={() => {
            setFilters({
              search: "",
              status: "ALL",
              source: "ALL",
              minScore: "",
              remoteOnly: false,
              worldwideOnly: false,
              sort: "highest_score",
            });
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />

        {/* Jobs Table */}
        <JobsTable
          jobs={jobs}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(newPage) =>
            setPagination((prev) => ({ ...prev, page: newPage }))
          }
          onStatusChange={handleStatusChange}
          onViewDetails={handleViewDetails}
        />
      </main>

      {/* Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatusAndNotes={handleUpdateStatusAndNotes}
      />

      {/* Candidate Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={() => {
          fetchStats();
          fetchJobs(filters, pagination.page);
        }}
      />
    </div>
  );
}
