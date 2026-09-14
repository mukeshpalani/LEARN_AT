import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GitBranch, Check, Clock, Award, Sparkles, BookOpen, ChevronRight, Play, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function RoadmapsPage() {
  const [selectedSkill, setSelectedSkill] = useState("Python Fundamentals");
  
  // Available skills to generate custom roadmaps for
  const availableSkills = [
    "Python Fundamentals",
    "Data Processing (Pandas & NumPy)",
    "Machine Learning Fundamentals",
    "Data Quality & Cleaning",
    "React & Frontend Architecture",
    "SQL & Relational Databases",
    "Cloud Architecture & DevOps",
  ];

  const roadmapQuery = trpc.roadmaps.getForSkill.useQuery({ skillName: selectedSkill });
  const roadmap = roadmapQuery.data;

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="eyebrow inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <GitBranch size={14} /> INDIVIDUAL SKILL ROADMAPS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Personalized Learning Roadmaps
          </h1>
          <p className="text-sm text-muted-foreground">
            Every recommended skill features a custom stage-by-stage learning path adapted to your current experience level.
          </p>
        </div>
      </div>

      {/* Skill Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {availableSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(skill)}
            className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedSkill === skill
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Roadmap Content */}
      {roadmapQuery.isLoading ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl space-y-3">
          <Sparkles size={24} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Building personalized roadmap for {selectedSkill}…</p>
        </div>
      ) : roadmap ? (
        <div className="space-y-6">
          {/* Skill Meta Banner */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Target Skill</span>
              <h2 className="text-xl font-bold text-foreground mt-1">{roadmap.skillName}</h2>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Adapted Experience Level</span>
              <p className="text-sm font-semibold text-primary mt-1">{roadmap.currentLevel} → {roadmap.targetLevel}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Estimated Time</span>
              <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <Clock size={15} /> {roadmap.estimatedHours} Hours
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Prerequisites</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {roadmap.prerequisites?.map((p: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stages Roadmap Tree */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground">Learning Stages & Milestones</h3>
            
            <div className="space-y-4 relative before:absolute before:left-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-border">
              {roadmap.stages?.map((stage: any, idx: number) => (
                <div key={idx} className="relative pl-14">
                  {/* Step Badge */}
                  <div className="absolute left-2 top-4 size-9 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center ring-4 ring-background">
                    0{stage.stageNumber}
                  </div>

                  {/* Stage Card */}
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground">{stage.title}</h4>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        Stage {stage.stageNumber}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">{stage.description}</p>

                    {/* Topics List */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Topics & Subtopics
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {stage.topics?.map((topic: string, tIdx: number) => (
                          <div key={tIdx} className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border flex items-center gap-2 text-foreground">
                            <Check size={14} className="text-green-500" /> {topic}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Practice & Mini Project */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                          <BookOpen size={13} /> Practice Task
                        </span>
                        <p className="text-xs text-foreground">{stage.practiceTask}</p>
                      </div>

                      <div className="p-3 bg-secondary/30 border border-border rounded-xl space-y-1">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <Award size={13} /> Mini Project
                        </span>
                        <p className="text-xs text-foreground">{stage.miniProject}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Major Capstone Project */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl space-y-3">
            <span className="eyebrow text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} /> CAPSTONE PROJECT
            </span>
            <h3 className="text-xl font-bold text-foreground">{roadmap.majorProject}</h3>
            <p className="text-xs text-muted-foreground">
              Complete this major portfolio project to demonstrate practical competency in {roadmap.skillName}.
            </p>
            <a
              href="/practice"
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-colors shadow-md mt-2"
            >
              Start Skill Practice <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
