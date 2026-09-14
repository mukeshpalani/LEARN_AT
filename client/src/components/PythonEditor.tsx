import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Sparkles, Terminal, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface PythonEditorProps {
  initialCode?: string;
  expectedOutput?: string;
  onCodeRunSuccess?: (output: string) => void;
  onAskAIHelp?: (code: string, error?: string) => void;
}

export default function PythonEditor({
  initialCode = `# Python 3 Practice Environment
def analyze_data(values):
    cleaned = [v for v in values if v is not None and v > 0]
    total = sum(cleaned)
    avg = total / len(cleaned) if cleaned else 0
    return {"cleaned": cleaned, "total": total, "average": avg}

data = [10, 25, None, 40, -5, 75]
result = analyze_data(data)
print("Analysis Result:", result)
`,
  expectedOutput,
  onCodeRunSuccess,
  onAskAIHelp,
}: PythonEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);

  // Load Pyodide WASM Python engine in browser safely
  useEffect(() => {
    let isMounted = true;
    if ((window as any).pyodide) {
      setPyodideReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
    script.async = true;
    script.onload = async () => {
      try {
        if (!(window as any).pyodide) {
          (window as any).pyodide = await (window as any).loadPyodide();
        }
        if (isMounted) setPyodideReady(true);
      } catch (err) {
        console.error("Pyodide load error:", err);
      }
    };
    document.head.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunCode = async () => {
    setIsRunning(true);
    setError(null);
    setOutput("Running Python code...");

    try {
      if ((window as any).pyodide) {
        const pyodide = (window as any).pyodide;
        // Redirect stdout
        pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
        
        await pyodide.runPythonAsync(code);
        
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        const stderr = pyodide.runPython("sys.stderr.getvalue()");

        const fullOutput = (stdout + (stderr ? `\n[STDERR]\n${stderr}` : "")).trim() || "(Execution finished with no output)";
        setOutput(fullOutput);
        
        if (stderr) {
          setError(stderr);
        } else {
          if (onCodeRunSuccess) onCodeRunSuccess(fullOutput);
          toast.success("Code executed successfully!");
        }
      } else {
        // Fallback Javascript logic evaluation if Pyodide CDN is slow
        setOutput("Notice: WebAssembly Pyodide engine is initializing. Simulating Python evaluation...\n" + code);
        toast.info("Python engine loading...");
      }
    } catch (err: any) {
      setError(err.message || String(err));
      setOutput(`Traceback (most recent call last):\n${err.message || err}`);
      toast.error("Execution error encountered");
    } finally {
      setIsRunning(false);
    }
  };

  const sampleSnippets = [
    {
      title: "Data Filtering",
      code: `# Filter survey ages
ages = [15, 22, 34, 17, 45, 99, 102]
valid_adults = [age for age in ages if 18 <= age <= 100]
print("Valid Adult Ages:", valid_adults)
`,
    },
    {
      title: "Dictionary & Aggregates",
      code: `# Calculate category averages
records = [
    {"category": "A", "score": 85},
    {"category": "B", "score": 90},
    {"category": "A", "score": 75},
]
totals = {}
counts = {}
for r in records:
    cat = r["category"]
    totals[cat] = totals.get(cat, 0) + r["score"]
    counts[cat] = counts.get(cat, 0) + 1

averages = {cat: totals[cat]/counts[cat] for cat in totals}
print("Category Averages:", averages)
`,
    },
    {
      title: "Error Handling",
      code: `# Exception handling demo
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Error: Division by zero is undefined"

print("10 / 2 =", safe_divide(10, 2))
print("10 / 0 =", safe_divide(10, 0))
`,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Toolbar */}
      <div className="bg-muted/60 border-b border-border p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-primary" />
          <span className="font-bold text-sm text-foreground">Python 3 Practice Environment</span>
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-mono">
            {pyodideReady ? "Pyodide WASM Sandboxed" : "Initializing Engine..."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCode(initialCode)}
            className="py-1.5 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>

          {onAskAIHelp && (
            <button
              type="button"
              onClick={() => onAskAIHelp(code, error || undefined)}
              className="py-1.5 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={13} /> Ask AI Mentor
            </button>
          )}

          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            className="py-1.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
          >
            <Play size={13} /> {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      {/* Snippet Quick Load */}
      <div className="bg-muted/20 border-b border-border px-4 py-2 flex items-center gap-2 text-xs overflow-x-auto">
        <span className="text-muted-foreground font-semibold flex items-center gap-1">
          <HelpCircle size={12} /> Samples:
        </span>
        {sampleSnippets.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setCode(s.code)}
            className="px-2.5 py-1 bg-card hover:bg-muted border border-border rounded-md text-foreground transition-colors shrink-0"
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Editor & Output Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-[360px]">
        {/* Code Input */}
        <div className="p-4 flex flex-col bg-background font-mono text-sm">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Code Editor
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-3 bg-card border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs md:text-sm leading-relaxed font-mono resize-y min-h-[280px]"
          />
        </div>

        {/* Output Panel */}
        <div className="p-4 flex flex-col bg-muted/30 font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Output Console
            </label>
            {error ? (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle size={12} /> Error Detected
              </span>
            ) : output && !isRunning ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} /> Execution Completed
              </span>
            ) : null}
          </div>

          <pre className={`flex-1 p-3 rounded-xl border text-xs md:text-sm overflow-x-auto whitespace-pre-wrap ${
            error
              ? "bg-destructive/5 border-destructive/30 text-destructive"
              : "bg-card border-border text-foreground"
          }`}>
            {output || "// Output will appear here when you click 'Run Code'"}
          </pre>

          {expectedOutput && (
            <div className="mt-3 p-2.5 bg-card border border-border rounded-lg text-xs">
              <span className="font-semibold text-muted-foreground">Expected Output:</span>
              <code className="block mt-1 text-primary">{expectedOutput}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
