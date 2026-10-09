"use client";

import React from "react";
import {
  Briefcase,
  Sparkles,
  Bookmark,
  Send,
  CalendarCheck,
  Award,
  CheckCircle,
  XCircle,
} from "lucide-react";

export interface DashboardStats {
  totalJobs: number;
  newJobs: number;
  savedJobs: number;
  appliedJobs: number;
  interviewsCount: number;
  offersCount: number;
  selectedCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  highMatchCount: number;
}

interface StatsCardsProps {
  stats: DashboardStats | null;
  activeStatusFilter: string;
  onSelectFilter: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  activeStatusFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: "ALL",
      label: "Total Jobs",
      count: stats?.totalJobs ?? 0,
      icon: Briefcase,
      color: "from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30",
      activeRing: "ring-2 ring-blue-500",
    },
    {
      id: "NEW",
      label: "New Jobs",
      count: stats?.newJobs ?? 0,
      icon: Sparkles,
      color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
      activeRing: "ring-2 ring-amber-500",
    },
    {
      id: "SAVED",
      label: "Saved Jobs",
      count: stats?.savedJobs ?? 0,
      icon: Bookmark,
      color: "from-cyan-500/20 to-sky-500/10 text-cyan-400 border-cyan-500/30",
      activeRing: "ring-2 ring-cyan-500",
    },
    {
      id: "APPLIED",
      label: "Applied",
      count: stats?.appliedJobs ?? 0,
      icon: Send,
      color: "from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30",
      activeRing: "ring-2 ring-indigo-500",
    },
    {
      id: "INTERVIEW",
      label: "Interviews",
      count: stats?.interviewsCount ?? 0,
      icon: CalendarCheck,
      color: "from-violet-500/20 to-fuchsia-500/10 text-violet-400 border-violet-500/30",
      activeRing: "ring-2 ring-violet-500",
    },
    {
      id: "OFFER",
      label: "Offers",
      count: stats?.offersCount ?? 0,
      icon: Award,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
      activeRing: "ring-2 ring-emerald-500",
    },
    {
      id: "SELECTED",
      label: "Selected",
      count: stats?.selectedCount ?? 0,
      icon: CheckCircle,
      color: "from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30",
      activeRing: "ring-2 ring-green-500",
    },
    {
      id: "REJECTED",
      label: "Rejected",
      count: stats?.rejectedCount ?? 0,
      icon: XCircle,
      color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
      activeRing: "ring-2 ring-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 my-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatusFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left transition-all hover:bg-slate-800/80 cursor-pointer ${
              isActive ? card.activeRing : "hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 truncate">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {card.count.toLocaleString()}
            </div>
          </button>
        );
      })}
    </div>
  );
};
