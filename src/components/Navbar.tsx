"use client";

import React from "react";
import { Briefcase, RefreshCw, UserCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface NavbarProps {
  onSync: () => void;
  isSyncing: boolean;
  onOpenProfile: () => void;
  lastSyncMessage?: string | null;
  lastSyncError?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSync,
  isSyncing,
  onOpenProfile,
  lastSyncMessage,
  lastSyncError,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Job Tracker Pro
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Multi-Source Automated
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-lg text-slate-300 bg-slate-800/80 hover:bg-slate-750 hover:text-white border border-slate-700/80 transition-all cursor-pointer"
              title="Candidate Profile Settings"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Profile & Rules</span>
            </button>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-md transition-all cursor-pointer ${
                isSyncing
                  ? "bg-blue-600/60 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 hover:shadow-blue-600/50"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing Sources..." : "Sync Jobs"}</span>
            </button>
          </div>
        </div>

        {/* Sync notification bar if message exists */}
        {lastSyncMessage && (
          <div className="pb-3 text-xs flex items-center space-x-2 text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{lastSyncMessage}</span>
          </div>
        )}
        {lastSyncError && (
          <div className="pb-3 text-xs flex items-center space-x-2 text-rose-400 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lastSyncError}</span>
          </div>
        )}
      </div>
    </header>
  );
};
