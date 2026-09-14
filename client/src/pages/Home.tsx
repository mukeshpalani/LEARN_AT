import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowUpRight, Award, BarChart3, BookOpen, BrainCircuit, Check, ChevronRight,
  ClipboardCheck, FileText, Gauge, GitBranch, LayoutDashboard, Lightbulb, LogOut,
  Menu, Network, Play, Rocket, Sparkles, Terminal, UsersRound, Zap, ShieldCheck, HelpCircle
} from "lucide-react";
import AuthPage from "./AuthPage";
import OnboardingPage from "./OnboardingPage";
import RoadmapsPage from "./RoadmapsPage";
import DocumentsPage from "./DocumentsPage";
import PythonLabPage from "./PythonLabPage";
import AdminDashboardPage from "./AdminDashboardPage";
import FloatingAIMentor from "@/components/FloatingAIMentor";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "roadmap", label: "Skill Roadmaps", icon: GitBranch },
  { id: "practice", label: "Daily Practice", icon: BookOpen },
  { id: "documents", label: "Study Material", icon: FileText },
  { id: "python-lab", label: "Python Lab", icon: Terminal },
  { id: "mission", label: "Practical Mission", icon: Rocket },
  { id: "passport", label: "Skill Passport", icon: Award },
];

type Tab = "overview" | "roadmap" | "practice" | "documents" | "python-lab" | "mission" | "passport" | "admin";

function initials(name?: string | null) { return (name || "LA").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(); }
function scoreTone(score: number) { return score >= 75 ? "good" : score >= 55 ? "mid" : "risk"; }
function statusLabel(score: number) { return score >= 75 ? "MASTERED" : score >= 55 ? "IN PROGRESS" : "NEEDS PRACTICE"; }

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileNav, setMobileNav] = useState(false);

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const workspaceQuery = trpc.workspace.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const analysisQuery = trpc.profile.analyze.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const dailyPracticeQuery = trpc.practice.getDaily.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const utils = trpc.useUtils();
  const learningComplete = trpc.learning.complete.useMutation({
    onSuccess: () => {
      toast.success("Learning event recorded!");
      utils.workspace.get.invalidate();
    },
  });
  const missionSubmit = trpc.mission.submit.useMutation({
    onSuccess: () => {
      toast.success("Evidence accepted. Your digital twin updated.");
      utils.workspace.get.invalidate();
      setTab("passport");
    },
  });

  const profile = profileQuery.data;
  const workspace = workspaceQuery.data;
  const analysis = analysisQuery.data;
  const dailyTask = dailyPracticeQuery.data;
  const competencies = workspace?.competencies ?? [];
  const average = competencies.length ? Math.round(competencies.reduce((sum: number, item: any) => sum + item.currentScore, 0) / competencies.length) : 0;
  const nextAction = competencies.find((item: any) => item.status === "NEEDS PRACTICE") ?? competencies.find((item: any) => item.status === "IN PROGRESS");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="brand-mark">la</div>
          <span className="text-sm text-muted-foreground">Loading your personalized learning twin…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage onAuthSuccess={() => utils.profile.get.invalidate()} />;
  if (!profile) return <OnboardingPage userName={user?.name} onComplete={() => utils.profile.get.invalidate()} />;

  const setActiveTab = (next: Tab) => { setTab(next); setMobileNav(false); };
  const isAdmin = user?.role === "admin" || localStorage.getItem("activeRole") === "admin";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">la</div>
          <div>
            <div className="brand-name">learn at</div>
            <div className="brand-tag">capability intelligence</div>
          </div>
        </div>

        <div className="workspace-pill">
          <span className="live-dot" /> {profile.learnerType || "Learner"} Twin
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-label">LEARNING ENVIRONMENT</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id as Tab)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.id === "overview" && <span className="nav-dot" />}
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="nav-label nav-label-spaced">ADMINISTRATION</div>
              <button
                className={`nav-item ${tab === "admin" ? "active" : ""}`}
                onClick={() => setActiveTab("admin")}
              >
                <ShieldCheck size={17} />
                <span>Admin Dashboard</span>
                <span className="synthetic-badge">admin</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <Lightbulb size={16} />
            <div>
              <strong>Skill Gap Engine Active</strong>
              <span>Target: {profile.goals || "Skill Growth"}</span>
            </div>
          </div>

          <button className="user-chip" onClick={logout}>
            <span className="avatar">{initials(user?.name || profile.fullName)}</span>
            <span className="user-chip-copy">
              <strong>{user?.name || profile.fullName}</strong>
              <span className="text-xs text-muted-foreground">Sign out</span>
            </span>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      {/* Main Area */}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{navItems.find((item) => item.id === tab)?.label ?? "Admin Dashboard"}</strong>
          </div>

          <div className="topbar-actions">
            <span className="updated"><span className="live-dot" /> Intelligence Twin Active</span>
            <div className="top-avatar">{initials(user?.name || profile.fullName)}</div>
          </div>
        </header>

        <div className="content-wrap">
          {tab === "overview" && (
            <OverviewSection
              profile={profile}
              competencies={competencies}
              average={average}
              nextAction={nextAction}
              analysis={analysis}
              onTab={setActiveTab}
            />
          )}

          {tab === "roadmap" && <RoadmapsPage />}
          {tab === "practice" && (
            <PracticeSection
              dailyTask={dailyTask}
              learningComplete={learningComplete}
            />
          )}
          {tab === "documents" && <DocumentsPage />}
          {tab === "python-lab" && <PythonLabPage />}
          {tab === "mission" && <MissionSection submit={missionSubmit} />}
          {tab === "passport" && <PassportSection profile={profile} competencies={competencies} evidence={workspace?.evidence ?? []} />}
          {tab === "admin" && <AdminDashboardPage />}
        </div>
      </main>

      {/* Floating AI Mentor */}
      <FloatingAIMentor pageContext={navItems.find((item) => item.id === tab)?.label ?? "Dashboard"} />
    </div>
  );
}

/* Sub-components */

function OverviewSection({ profile, competencies, average, nextAction, analysis, onTab }: any) {
  const critical = [...competencies].sort((a, b) => a.currentScore - b.currentScore).slice(0, 3);

  return (
    <section className="page-enter space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <span className="eyebrow"><span className="live-dot" /> YOUR CAPABILITY TWIN</span>
          <h1>Welcome back, {profile.fullName.split(" ")[0]}.</h1>
          <p>Role: <strong>{profile.roleTitle}</strong> ({profile.organization}) · Target Goal: <em>{profile.goals || "Skill Growth"}</em></p>
        </div>
      </div>

      {/* Twin Readiness Grid */}
      <div className="hero-grid">
        <div className="twin-card">
          <div className="card-kicker">COMPETENCY DIGITAL TWIN <span className="info-dot">i</span></div>
          <div className="twin-score-row">
            <div>
              <span className="score-label">Overall Readiness Score</span>
              <div className="big-score">{average}<small>/100</small></div>
              <span className="score-change"><ArrowUpRight size={13} /> AI-Assisted Skill Twin</span>
            </div>
            <div className="ring-chart" style={{ "--ring": `${average * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{average}%</strong><span>readiness</span></div>
            </div>
          </div>
          <div className="twin-foot">
            <span><span className="live-dot" /> Evidence-backed profile</span>
            <span>Updated today</span>
          </div>
        </div>

        <div className="next-action-card">
          <div className="card-kicker accent-kicker"><Zap size={14} /> NEXT RECOMMENDED ACTION</div>
          <h3>Master {nextAction?.name ?? "Python Fundamentals"}</h3>
          <p>{nextAction?.rationale ?? "Targeted step based on your current skills and target goal."}</p>
          <div className="action-meta">
            <span><BookOpen size={14} /> 25 min practice</span>
            <span><Gauge size={14} /> High Leverage</span>
          </div>
          <button className="primary-button" onClick={() => onTab("practice")}>
            Start Daily Practice <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* AI Profile Intelligence & Skill Gap Section */}
      {analysis && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-bold text-lg text-foreground">AI Skill Gap & Career Pathway Analysis</h3>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border leading-relaxed">
            {analysis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Strong Areas</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.strongAreas?.map((s: string, i: number) => (
                  <Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-none text-[11px]">
                    <Check size={12} className="mr-1 inline" /> {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Weak Areas</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.weakAreas?.map((w: string, i: number) => (
                  <Badge key={i} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-none text-[11px]">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Missing Target Skills</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.missingSkills?.map((m: string, i: number) => (
                  <Badge key={i} className="bg-primary/10 text-primary border-none text-[11px]">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Learning Path */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Recommended Learning Progression: Current Skills → Goal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysis.recommendedPath?.map((step: any, i: number) => (
                <div key={i} className="p-4 border border-border rounded-xl bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">Step 0{step.step}</span>
                    <span className="text-muted-foreground">{step.estimatedWeeks} wks</span>
                  </div>
                  <strong className="text-sm text-foreground block">{step.skill}</strong>
                  <p className="text-xs text-muted-foreground">{step.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skill Gaps Card List */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">PRIORITY COMPETENCIES</span>
          <h2>Skill Gaps & Next Focus Areas</h2>
        </div>
        <button className="text-button" onClick={() => onTab("passport")}>View passport <ChevronRight size={15} /></button>
      </div>

      <div className="gap-grid">
        {critical.map((item: any, index: number) => (
          <button key={item.competencyId} className="gap-card" onClick={() => onTab("roadmap")}>
            <div className="gap-index">0{index + 1}</div>
            <div className="gap-content">
              <div className="gap-title-row">
                <strong>{item.name}</strong>
                <Badge className={`status-badge ${scoreTone(item.currentScore)}`}>
                  {item.currentScore} · {statusLabel(item.currentScore)}
                </Badge>
              </div>
              <Progress value={item.currentScore} className="score-progress" />
              <p>{item.rationale}</p>
              <span className="why-link">Open skill roadmap <ArrowUpRight size={13} /></span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function PracticeSection({ dailyTask, learningComplete }: any) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  return (
    <section className="page-enter space-y-8">
      <div className="page-header">
        <div>
          <span className="eyebrow"><BookOpen size={14} /> ADAPTIVE DAILY PRACTICE</span>
          <h1>Today’s Practice Session</h1>
          <p>Generated based on your active roadmap, performance history, and weak areas.</p>
        </div>
      </div>

      {dailyTask && (
        <div className="space-y-6">
          {/* Concept Overview Card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-xs font-bold text-primary uppercase">1. Concept Overview ({dailyTask.estimatedMinutes} min)</span>
              <Badge className="bg-primary/10 text-primary">{dailyTask.topicName}</Badge>
            </div>
            <h3 className="text-lg font-bold text-foreground">{dailyTask.topicName}</h3>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border">
              {dailyTask.conceptOverview}
            </p>
          </div>

          {/* Coding & Debugging Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coding Task */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <span className="eyebrow text-xs font-bold text-primary uppercase">2. Coding Task</span>
              <h4 className="font-bold text-sm text-foreground">{dailyTask.codingTask?.title}</h4>
              <p className="text-xs text-muted-foreground">{dailyTask.codingTask?.instructions}</p>
              <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground overflow-x-auto">
                {dailyTask.codingTask?.starterCode}
              </pre>
              <a
                href="/python-lab"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Open in Python Lab <ArrowUpRight size={14} />
              </a>
            </div>

            {/* Debugging Task */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <span className="eyebrow text-xs font-bold text-primary uppercase">3. Debugging Exercise</span>
              <h4 className="font-bold text-sm text-foreground">{dailyTask.debuggingTask?.title}</h4>
              <p className="text-xs text-muted-foreground">Hint: {dailyTask.debuggingTask?.bugHint}</p>
              <pre className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-mono overflow-x-auto">
                {dailyTask.debuggingTask?.brokenCode}
              </pre>
              <a
                href="/python-lab"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Debug in Python Lab <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Quick Quiz Card */}
          {dailyTask.quizQuestion && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <span className="eyebrow text-xs font-bold text-primary uppercase">4. Quick Check Quiz</span>
              <h4 className="font-bold text-sm text-foreground">{dailyTask.quizQuestion.question}</h4>

              <div className="space-y-2">
                {dailyTask.quizQuestion.options?.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => !quizSubmitted && setSelectedOption(idx)}
                    className={`w-full p-3 rounded-xl text-xs text-left border transition-all flex items-center justify-between ${
                      selectedOption === idx ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:bg-muted/40"
                    } ${quizSubmitted && idx === dailyTask.quizQuestion.correctAnswer ? "!border-green-500 !bg-green-50 text-green-900" : ""}`}
                  >
                    <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                    {quizSubmitted && idx === dailyTask.quizQuestion.correctAnswer && <Check size={14} className="text-green-600" />}
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={selectedOption === null}
                  className="py-2 px-5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                  💡 {dailyTask.quizQuestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* Complete Button */}
          <div className="pt-4 flex justify-end">
            <button
              className="py-3 px-8 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              onClick={() =>
                learningComplete.mutate({
                  topicId: dailyTask.topicName,
                  competencyId: dailyTask.topicName,
                  source: "Adaptive Daily Practice",
                  timeSpent: dailyTask.estimatedMinutes || 20,
                  contentCovered: dailyTask.conceptOverview,
                })
              }
              disabled={learningComplete.isPending}
            >
              {learningComplete.isPending ? "Recording Progress..." : "Complete Today's Practice"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MissionSection({ submit }: any) {
  const [ran, setRan] = useState(false);
  const [score] = useState(82);

  return (
    <section className="page-enter space-y-8">
      <div className="page-header">
        <div>
          <span className="eyebrow"><Rocket size={14} /> PRACTICAL MISSION</span>
          <h1>Show Competency with Evidence</h1>
          <p>Complete real-world practical tasks to generate verifiable digital evidence.</p>
        </div>
      </div>

      <div className="mission-hero">
        <div className="mission-number">01</div>
        <div className="mission-copy">
          <span className="eyebrow">DATA PROCESSING MISSION</span>
          <h2>Automate Household Survey Data Cleaning Pipeline</h2>
          <p>Clean messy survey records, detect missing values, and output summary statistics.</p>
          <div className="mission-actions">
            <a href="/python-lab" className="primary-button inline-flex items-center gap-2">
              <Play size={15} /> Open Python Lab
            </a>
            <button className="secondary-button" onClick={() => setRan(true)}>
              Simulate Mission Run
            </button>
          </div>
        </div>
      </div>

      {ran && (
        <div className="submission-card space-y-4">
          <h3 className="font-bold text-foreground">Mission Evidence Output</h3>
          <p className="text-xs text-muted-foreground">
            Pipeline validated. 98% records processed, outliers logged, summary produced.
          </p>
          <button
            className="primary-button"
            onClick={() =>
              submit.mutate({
                missionId: "survey-cleaning",
                score,
                summary: "Built automated data cleaning pipeline in Python with missing value handling.",
              })
            }
            disabled={submit.isPending}
          >
            {submit.isPending ? "Submitting Evidence..." : "Submit Evidence & Update Twin"}
          </button>
        </div>
      )}
    </section>
  );
}

function PassportSection({ profile, competencies, evidence }: any) {
  return (
    <section className="page-enter space-y-8">
      <div className="page-header">
        <div>
          <span className="eyebrow"><Award size={14} /> COMPETENCY TWIN PASSPORT</span>
          <h1>{profile.fullName}’s Skill Passport</h1>
          <p>Living snapshot of evidence-backed skill states.</p>
        </div>
      </div>

      <div className="passport-banner">
        <div className="passport-avatar">{initials(profile.fullName)}</div>
        <div>
          <span className="eyebrow">ROLE & FIELD</span>
          <h2>{profile.roleTitle}</h2>
          <p>{profile.organization} · {profile.domain}</p>
        </div>
        <div className="passport-stat">
          <strong>{competencies.filter((c: any) => c.currentScore >= 75).length}</strong>
          <span>mastered</span>
        </div>
      </div>

      <div className="passport-grid">
        {competencies.map((item: any) => (
          <div className="passport-card" key={item.competencyId}>
            <Badge className={`status-badge ${scoreTone(item.currentScore)}`}>{item.status}</Badge>
            <h3 className="font-bold text-foreground mt-2">{item.name}</h3>
            <div className="passport-score mt-3">
              <strong>{item.currentScore}</strong><span>/100</span>
              <Progress value={item.currentScore} className="score-progress" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{item.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
