"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Building,
  Calendar,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";
import { ApplicationStatus, MatchDetails } from "@/types/job";
import { JobItem } from "./JobsTable";

interface TimelineItem {
  id: string;
  fromStatus?: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  notes?: string | null;
  createdAt: string;
}

interface JobDetailModalProps {
  job: JobItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatusAndNotes: (
    jobId: string,
    status: ApplicationStatus,
    notes?: string,
    interviewDate?: string | null
  ) => Promise<void>;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateStatusAndNotes,
}) => {
  const [activeTab, setActiveTab] = useState<"description" | "timeline" | "notes">("description");
  const [status, setStatus] = useState<ApplicationStatus>(job?.status || "NEW");
  const [notes, setNotes] = useState<string>(job?.notes || "");
  const [interviewDate, setInterviewDate] = useState<string>(
    job?.interviewDate ? job.interviewDate.substring(0, 10) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [fullDescription, setFullDescription] = useState<string>("");

  useEffect(() => {
    if (job) {
      setStatus(job.status);
      setNotes(job.notes || "");
      setInterviewDate(job.interviewDate ? job.interviewDate.substring(0, 10) : "");
      setFullDescription("");

      // Fetch full job with history timeline
      fetch(`/api/jobs/${job.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setTimeline(data.data.history || []);
            setFullDescription(data.data.description || "");
            if (data.data.notes) setNotes(data.data.notes);
            if (data.data.interviewDate) {
              setInterviewDate(data.data.interviewDate.substring(0, 10));
            }
          }
        })
        .catch(console.error);
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatusAndNotes(
        job.id,
        status,
        notes,
        interviewDate ? new Date(interviewDate).toISOString() : null
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      // Refresh timeline
      const res = await fetch(`/api/jobs/${job.id}`);
      const json = await res.json();
      if (json.success && json.data?.history) {
        setTimeline(json.data.history);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const matchDetails = job.matchDetails as MatchDetails | undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {job.source}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Match Score: {job.matchScore}%
              </span>
              {job.isRemote && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Remote
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 mt-2">
              <span className="flex items-center space-x-1 text-slate-300 font-medium">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{job.company}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{job.location || "Remote / Worldwide"}</span>
              </span>
              {job.salary && (
                <span className="font-semibold text-emerald-400">
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header Ribbon */}
        <div className="bg-slate-950/90 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 font-medium">Current Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEW">New</option>
              <option value="SAVED">Saved</option>
              <option value="APPLY">To Apply</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="TECHNICAL_INTERVIEW">Tech Interview</option>
              <option value="FINAL_INTERVIEW">Final Interview</option>
              <option value="OFFER">Offer Received</option>
              <option value="SELECTED">Selected / Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={job.applyUrl || job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Apply on Original Site</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Updates"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-5 text-sm">
          <button
            onClick={() => setActiveTab("description")}
            className={`py-3 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "description"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Job Description & Match Details
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-3 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "notes"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Application Notes & Dates
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-3 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "timeline"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Application Timeline ({timeline.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "description" && (
            <div className="space-y-6">
              {/* Match Details Breakdown Box */}
              {matchDetails && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200 mb-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Candidate Profile Match Breakdown</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs text-center mb-4">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Role Match</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {matchDetails.titleScore} / 35
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Skills Match</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {matchDetails.skillsScore} / 35
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Remote Score</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {matchDetails.remoteScore} / 15
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Experience</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {matchDetails.experienceScore} / 10
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Location</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {matchDetails.locationScore} / 5
                      </div>
                    </div>
                  </div>

                  {/* Matched skills tags */}
                  {matchDetails.matchedSkills && matchDetails.matchedSkills.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                        Matched Candidate Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchDetails.matchedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Description text/HTML */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Description
                </h3>
                <div
                  className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80"
                  dangerouslySetInnerHTML={{
                    __html: fullDescription || job.salary || "No description provided.",
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Interview Date (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Candidate Notes, Recruiter Info, and Application Log
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                  placeholder="Record application details, cover letter tweaks, questions for the hiring manager, salary negotiations..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                {isSaving ? "Saving Notes..." : "Save Notes"}
              </button>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No status transitions recorded yet. Changes will be logged here.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {timeline.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-white">
                            Status changed to:{" "}
                            <span className="text-blue-400">{item.toStatus}</span>
                            {item.fromStatus && (
                              <span className="text-slate-400"> (from {item.fromStatus})</span>
                            )}
                          </span>
                          <span className="text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-300 mt-2 bg-slate-900/80 p-2 rounded border border-slate-800">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
