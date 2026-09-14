import React from "react";
import PythonEditor from "@/components/PythonEditor";
import { Terminal, Code2, Sparkles, CheckCircle2 } from "lucide-react";

export default function PythonLabPage() {
  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <span className="eyebrow inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
          <Terminal size={14} /> BUILT-IN PRACTICE ENVIRONMENT
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
          Python Practice Lab
        </h1>
        <p className="text-sm text-muted-foreground">
          Practice Python algorithms, data structures, and data analysis tasks right inside the platform. Powered by WebAssembly for instant, sandboxed execution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PythonEditor
          initialCode={`# Python Practice Lab
def solve_challenge():
    # Write a function that processes customer scores
    scores = [85, 92, 78, 90, 88, 95]
    avg_score = sum(scores) / len(scores)
    top_scores = [s for s in scores if s > avg_score]
    
    return {
        "average": round(avg_score, 2),
        "top_performers": top_scores
    }

print(solve_challenge())
`}
        />
      </div>
    </div>
  );
}
