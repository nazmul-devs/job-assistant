"use client";

import React, { useState, useEffect } from "react";
import { X, Save, UserCheck, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { CandidateProfileData } from "@/types/job";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [minExp, setMinExp] = useState<number>(5);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(true);
  const [minSalary, setMinSalary] = useState<number>(100000);
  const [salaryCurrency, setSalaryCurrency] = useState<string>("BDT");

  const [newRole, setNewRole] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setProfile(res.data);
            setTargetRoles(res.data.targetRoles || []);
            setSkills(res.data.skills || []);
            setMinExp(res.data.minExperienceYears ?? 5);
            setRemoteOnly(res.data.remoteOnly ?? true);
            setMinSalary(res.data.minSalary ?? 100000);
            setSalaryCurrency(res.data.salaryCurrency || "BDT");
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRole = () => {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole("");
    }
  };

  const handleRemoveRole = (role: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== role));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRoles,
          skills,
          minExperienceYears: Number(minExp),
          remoteOnly,
          minSalary: Number(minSalary),
          salaryCurrency,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        if (onProfileUpdated) onProfileUpdated();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Candidate Profile & Matching Rules</h2>
              <p className="text-xs text-slate-400">
                Job match scores are computed against these exact criteria without an LLM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs sm:text-sm">
          {/* Target Roles */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Target Roles (30-35% weight)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs"
                >
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role)}
                    className="hover:text-rose-400 ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Add role, e.g. Senior Backend Engineer"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Key Skills (35% weight)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-lg border border-slate-800/80">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-400 ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill, e.g. GraphQL, Terraform"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Remote & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Min Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={minExp}
                onChange={(e) => setMinExp(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Remote Requirement
              </label>
              <label className="flex items-center space-x-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                />
                <span className="text-xs text-slate-300">Remote Only Positions (15% weight)</span>
              </label>
            </div>
          </div>

          {/* Minimum Salary Expectation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Target Salary Expectation
              </label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Rules apply automatically on every sync or job ingestion.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
