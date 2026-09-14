import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Compass, Sparkles, GraduationCap, Briefcase, ArrowUpRight, CheckCircle, Clock } from "lucide-react";

export default function OnboardingPage({ userName, onComplete }: { userName?: string | null; onComplete?: () => void }) {
  const [learnerType, setLearnerType] = useState<"Student" | "Professional">("Student");
  
  // Common fields
  const [fullName, setFullName] = useState(userName || "");
  const [currentSkills, setCurrentSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("3-5 hours/week");

  // Student specific fields
  const [educationLevel, setEducationLevel] = useState("Undergraduate");
  const [courseDegree, setCourseDegree] = useState("B.Tech / B.E.");
  const [branchField, setBranchField] = useState("Computer Science");
  const [currentYear, setCurrentYear] = useState("3rd Year");
  const [programmingExperience, setProgrammingExperience] = useState("Beginner (Know basic syntax)");
  const [learningStyle, setLearningStyle] = useState("Hands-on Projects & Coding");

  // Professional specific fields
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [industry, setIndustry] = useState("Technology / IT");
  const [yearsExperience, setYearsExperience] = useState("1-3 years");
  const [responsibilities, setResponsibilities] = useState("");
  const [toolsUsed, setToolsUsed] = useState("Git, VS Code, SQL, Docker");
  const [skillsToImprove, setSkillsToImprove] = useState("");
  const [desiredRole, setDesiredRole] = useState("Senior Full-Stack Engineer / AI Engineer");

  const utils = trpc.useUtils();
  const profileSave = trpc.profile.save.useMutation({
    onSuccess: () => {
      toast.success("Profile saved and AI Skill Intelligence engine activated!");
      utils.profile.get.invalidate();
      utils.workspace.get.invalidate();
      if (onComplete) onComplete();
      else window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error("Please enter your name");
      return;
    }

    const isStudent = learnerType === "Student";
    const profilePayload = {
      fullName,
      learnerType,
      roleTitle: isStudent ? `${currentYear} ${courseDegree} Student` : jobRole,
      organization: isStudent ? `${branchField} (${educationLevel})` : `${industry} (${yearsExperience})`,
      experience: isStudent ? programmingExperience : yearsExperience,
      background: isStudent
        ? `Education: ${educationLevel} in ${courseDegree} (${branchField}), Year: ${currentYear}. Learning Style: ${learningStyle}`
        : `Industry: ${industry}, Responsibilities: ${responsibilities}. Current Tools: ${toolsUsed}`,
      domain: isStudent ? branchField : industry,
      currentSkills: currentSkills || (isStudent ? "Basic Python, Git" : "JavaScript, SQL, REST APIs"),
      interests: interests || (isStudent ? "Web Development, AI/ML" : "Cloud Architecture, System Design"),
      goals: goals || (isStudent ? `Land a role as ${courseDegree}` : `Transition to ${desiredRole}`),
      workType: isStudent ? `Student looking for ${learningStyle}` : `Professional aiming to improve ${skillsToImprove || desiredRole}`,
      timeAvailable,
    };

    profileSave.mutate(profilePayload);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Story */}
      <div className="hidden lg:flex w-1/3 bg-muted/40 border-r border-border p-12 flex-col justify-between">
        <div className="space-y-8">
          <div className="brand-lockup">
            <div className="brand-mark">la</div>
            <div>
              <div className="brand-name">learn at</div>
              <div className="brand-tag">capability intelligence</div>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <span className="eyebrow inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <Compass size={14} /> ADAPTIVE ONBOARDING
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Your context fuels your personalized learning engine.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We analyze your background, role, and goals to build custom skill roadmaps, daily practice, and AI mentorship tailored specifically to you.
            </p>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles size={14} /> Zero Generic Courses
          </div>
          <p className="text-xs text-muted-foreground">
            No cookie-cutter curriculums. We identify your exact skill gaps and adapt daily tasks as you learn.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              WELCOME {fullName ? `, ${fullName.toUpperCase()}` : ""}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
              Select your path to personalize your intelligence model
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose your primary status so we only ask questions relevant to your current stage.
            </p>
          </div>

          {/* Role Type Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setLearnerType("Student")}
              className={`p-6 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                learnerType === "Student"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                {learnerType === "Student" && <CheckCircle size={18} className="text-primary" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground">Student / College Learner</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Focus on degree coursework, foundational tech skills, project building, and career prep.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLearnerType("Professional")}
              className={`p-6 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                learnerType === "Professional"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
                {learnerType === "Professional" && <CheckCircle size={18} className="text-primary" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground">Working Professional / Employee</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Focus on industry tools, advanced architecture, domain specialization, and role promotion.
                </p>
              </div>
            </button>
          </div>

          {/* Form Sections */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3">
              {learnerType === "Student" ? "👨🎓 Student Profile" : "🏢 Professional Profile"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Student Fields */}
              {learnerType === "Student" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Education Level</label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>High School</option>
                      <option>Diploma</option>
                      <option>Undergraduate</option>
                      <option>Postgraduate / Master's</option>
                      <option>Ph.D. / Doctorate</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Course / Degree</label>
                    <input
                      type="text"
                      value={courseDegree}
                      onChange={(e) => setCourseDegree(e.target.value)}
                      placeholder="e.g. B.Tech, B.Sc, BCA"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Branch / Major Field</label>
                    <input
                      type="text"
                      value={branchField}
                      onChange={(e) => setBranchField(e.target.value)}
                      placeholder="e.g. Computer Science, Data Science, ECE"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Current Academic Year</label>
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year / Final Year</option>
                      <option>Graduated / Looking for Jobs</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Programming & Tech Experience Level</label>
                    <select
                      value={programmingExperience}
                      onChange={(e) => setProgrammingExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>Complete Beginner (No coding experience)</option>
                      <option>Beginner (Know basic syntax & variables)</option>
                      <option>Intermediate (Built small projects/scripts)</option>
                      <option>Advanced (Comfortable with algorithms & frameworks)</option>
                    </select>
                  </div>
                </>
              ) : (
                /* Professional Fields */
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Current Job Role</label>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g. Frontend Engineer, Analyst"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Industry / Sector</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. IT, Finance, Healthcare, E-commerce"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Years of Experience</label>
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>0-1 years (Entry level)</option>
                      <option>1-3 years (Mid level)</option>
                      <option>3-5 years (Experienced)</option>
                      <option>5+ years (Senior / Lead)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Tools & Technologies Used</label>
                    <input
                      type="text"
                      value={toolsUsed}
                      onChange={(e) => setToolsUsed(e.target.value)}
                      placeholder="e.g. Python, SQL, Docker, React, AWS"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Desired Role / Career Move</label>
                    <input
                      type="text"
                      value={desiredRole}
                      onChange={(e) => setDesiredRole(e.target.value)}
                      placeholder="e.g. AI Specialist, Lead Architect, Data Scientist"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {/* Shared Fields */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Existing Skills (What you already know)</label>
                <input
                  type="text"
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  placeholder="e.g. Python fundamentals, HTML/CSS, Basic SQL, Excel"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Areas of Interest (What excites you)</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Machine Learning, Cloud Computing, Full-Stack Web Development"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Target Career Goal</label>
                <textarea
                  rows={2}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Build end-to-end AI powered applications and qualify for senior engineering roles."
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Clock size={13} /> Time Available for Learning
                </label>
                <select
                  value={timeAvailable}
                  onChange={(e) => setTimeAvailable(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>1-2 hours/week (Light)</option>
                  <option>3-5 hours/week (Moderate)</option>
                  <option>6-10 hours/week (Dedicated)</option>
                  <option>10+ hours/week (Intensive)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-muted-foreground">
              Your profile is private and will drive your personal AI mentor.
            </span>
            <button
              type="submit"
              disabled={profileSave.isPending}
              className="py-3 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm rounded-xl flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              {profileSave.isPending ? "Generating Skill Twin..." : "Activate AI Skill Engine"}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
