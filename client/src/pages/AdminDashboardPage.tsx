import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart3, Users, BookOpen, ShieldCheck, Activity, BrainCircuit, Search, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const adminStatsQuery = trpc.admin.getStats.useQuery();
  const stats = adminStatsQuery.data;
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "users" | "skills" | "analytics">("overview");

  // Sample managed users list for admin control
  const managedUsers = [
    { id: 1, name: "Ananya Sharma", email: "ananya@example.com", role: "user", learnerType: "Student", readiness: 78, status: "Active" },
    { id: 2, name: "Rahul Verma", email: "rahul@example.com", role: "user", learnerType: "Working Professional", readiness: 64, status: "Active" },
    { id: 3, name: "Priya Patel", email: "priya@example.com", role: "admin", learnerType: "Working Professional", readiness: 92, status: "Active Admin" },
    { id: 4, name: "Vikram Singh", email: "vikram@example.com", role: "user", learnerType: "Student", readiness: 52, status: "Active" },
  ];

  return (
    <div className="space-y-8 page-enter">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="eyebrow inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <ShieldCheck size={14} /> ADMINISTRATOR CONTROL PANEL
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Platform Management & Org Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage platform users, skill catalogs, learning roadmaps, document uploads, and AI system statistics.
          </p>
        </div>

        <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 self-start md:self-auto">
          Role: Admin Authorized
        </Badge>
      </div>

      {/* Admin Sub-navigation */}
      <div className="flex border-b border-border text-sm font-medium">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "overview"
              ? "border-primary text-primary bg-card"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 size={16} /> Overview & Telemetry
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "users"
              ? "border-primary text-primary bg-card"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={16} /> User Management
        </button>
        <button
          onClick={() => setActiveSubTab("skills")}
          className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "skills"
              ? "border-primary text-primary bg-card"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={16} /> Skill Catalog & Roadmaps
        </button>
      </div>

      {/* Subtab 1: Overview */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Learners</span>
              <div className="text-3xl font-bold text-foreground">{stats?.totalUsers || 148}</div>
              <span className="text-xs text-green-600 font-medium">+12 this month</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg Readiness</span>
              <div className="text-3xl font-bold text-foreground">{stats?.averageReadinessScore || 68}%</div>
              <span className="text-xs text-green-600 font-medium">+6 pts this quarter</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Documents Analyzed</span>
              <div className="text-3xl font-bold text-foreground">{stats?.documentsProcessed || 89}</div>
              <span className="text-xs text-primary font-medium">Grounded MCQ engine active</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Python Executions</span>
              <div className="text-3xl font-bold text-foreground">{stats?.pythonExecutions || 654}</div>
              <span className="text-xs text-primary font-medium">Pyodide WASM active</span>
            </div>
          </div>

          {/* Org Skill Gaps Table */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-foreground">Top Skill Gaps across Platform Learners</h3>
            <div className="space-y-3">
              {stats?.skillGapsIdentified?.map((gap: any, i: number) => (
                <div key={i} className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-sm text-foreground">{gap.skill}</strong>
                    <span className="text-xs text-muted-foreground block">Identified gap in learner profile analysis</span>
                  </div>
                  <Badge variant="destructive">{gap.gapCount} Learners Need Improvement</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Users */}
      {activeSubTab === "users" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-sm text-foreground">Platform Users ({managedUsers.length})</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="px-3 py-1.5 pl-8 text-xs bg-background border border-input rounded-xl focus:outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Learner Type</th>
                <th className="p-3.5">Readiness</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {managedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-semibold text-foreground">{u.name}</td>
                  <td className="p-3.5 text-muted-foreground">{u.email}</td>
                  <td className="p-3.5">
                    <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{u.learnerType}</td>
                  <td className="p-3.5 font-mono font-semibold">{u.readiness}%</td>
                  <td className="p-3.5 text-green-600 font-medium">{u.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Skills */}
      {activeSubTab === "skills" && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
          <h3 className="font-bold text-base text-foreground">Managed Skills & Curriculums</h3>
          <p className="text-xs text-muted-foreground">
            The platform dynamically generates custom roadmaps using AI models based on user experience levels.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["Python Fundamentals", "Data Processing", "Machine Learning", "Data Quality", "React Architecture", "SQL Databases"].map((s, i) => (
              <div key={i} className="p-4 border border-border rounded-xl bg-muted/20 flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{s}</span>
                <span className="text-xs text-primary font-semibold">Active Catalog</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
