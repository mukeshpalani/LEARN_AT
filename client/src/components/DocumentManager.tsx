import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UploadCloud, FileText, Sparkles, BookOpen, MessageSquare, Check, HelpCircle, AlertCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function DocumentManager() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "questions" | "ask">("analysis");

  // Q&A states
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);

  // Quiz states
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const processMutation = trpc.documents.processAndAnalyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Document analyzed & grounded questions generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const askMutation = trpc.documents.askFile.useMutation({
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { q: userQuestion, a: data.answer }]);
      setUserQuestion("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setAnalysisResult(null);
    setChatHistory([]);
    setUserAnswers({});
    setSubmittedQuiz(false);

    // Read text content
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setExtractedText(text || `Document content from ${selectedFile.name}`);
      // Process with AI
      processMutation.mutate({
        fileName: selectedFile.name,
        fileText: text || `Content from ${selectedFile.name}`,
      });
    };

    if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt") || selectedFile.name.endsWith(".md")) {
      reader.readAsText(selectedFile);
    } else {
      // For PDF files or other formats, extract basic text or read as array buffer / string
      reader.readAsText(selectedFile);
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || !file) return;

    askMutation.mutate({
      fileName: file.name,
      fileText: extractedText || file.name,
      question: userQuestion,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Upload Study Material & Learning Content</h3>
            <p className="text-xs text-muted-foreground">
              Upload notes, PDFs, or documentation (TXT, MD, PDF). The system extracts content, generates grounded questions, and lets you ask questions about it.
            </p>
          </div>
        </div>

        <label className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
          <input type="file" accept=".pdf,.txt,.md" onChange={handleFileChange} className="hidden" />
          <FileText size={32} className="text-muted-foreground mb-2" />
          <span className="font-semibold text-sm text-foreground">
            {file ? file.name : "Click to choose or drag & drop learning document"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Supports PDF, TXT, and Markdown files
          </span>
        </label>

        {processMutation.isPending && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 text-sm text-primary">
            <Sparkles size={18} className="animate-spin" />
            <span>AI is reading, cleaning, and extracting key concepts from your document...</span>
          </div>
        )}
      </div>

      {/* Document Results */}
      {analysisResult && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-md">
          {/* Navigation Tabs */}
          <div className="bg-muted/50 border-b border-border flex text-sm font-medium">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "analysis"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={16} /> Document Summary & Concepts
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "questions"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle size={16} /> Grounded Practice Questions ({analysisResult.questions?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("ask")}
              className={`px-5 py-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "ask"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={16} /> Ask About This File
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* Tab 1: Analysis & Concepts */}
            {activeTab === "analysis" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Document Summary</h4>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Main Topics</h4>
                    <ul className="space-y-2">
                      {analysisResult.mainTopics?.map((t: string, i: number) => (
                        <li key={i} className="text-xs bg-card border border-border p-2.5 rounded-lg flex items-center gap-2 text-foreground">
                          <span className="size-2 rounded-full bg-primary" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Key Definitions</h4>
                    <ul className="space-y-2">
                      {analysisResult.keyDefinitions?.map((d: string, i: number) => (
                        <li key={i} className="text-xs bg-card border border-border p-2.5 rounded-lg flex items-center gap-2 text-foreground">
                          <Check size={14} className="text-green-500" /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Grounded Questions */}
            {activeTab === "questions" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    These questions are generated directly from the content of <strong className="text-foreground">{file?.name}</strong>.
                  </p>
                </div>

                {analysisResult.questions?.map((q: Question, idx: number) => (
                  <div key={idx} className="p-5 border border-border rounded-xl bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">Question {idx + 1}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{q.question}</h4>

                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => !submittedQuiz && setUserAnswers({ ...userAnswers, [idx]: optIdx })}
                          className={`w-full p-3 rounded-lg text-xs text-left border transition-all flex items-center justify-between ${
                            userAnswers[idx] === optIdx
                              ? "border-primary bg-primary/10 font-semibold"
                              : "border-border bg-background hover:bg-muted/40"
                          } ${submittedQuiz && optIdx === q.correctAnswer ? "!border-green-500 !bg-green-50 text-green-900" : ""}`}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                          {submittedQuiz && optIdx === q.correctAnswer && <Check size={14} className="text-green-600" />}
                        </button>
                      ))}
                    </div>

                    {submittedQuiz && (
                      <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg flex items-start gap-2">
                        <Sparkles size={14} className="text-primary mt-0.5" /> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {!submittedQuiz && (
                  <button
                    onClick={() => setSubmittedQuiz(true)}
                    disabled={Object.keys(userAnswers).length !== analysisResult.questions?.length}
                    className="py-2.5 px-6 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md disabled:opacity-50"
                  >
                    Check Answers
                  </button>
                )}
              </div>
            )}

            {/* Tab 3: Ask About File */}
            {activeTab === "ask" && (
              <div className="space-y-6">
                <div className="bg-muted/30 border border-border p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    Ask questions specific to <strong>{file?.name}</strong>. Answers are strictly grounded in your document text.
                  </p>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto p-2">
                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Try asking: "What are the main key points?", "Explain page 1 concepts", or "Summarize the conclusion."
                    </p>
                  ) : (
                    chatHistory.map((c, i) => (
                      <div key={i} className="space-y-2">
                        <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl text-xs font-semibold self-end">
                          Q: {c.q}
                        </div>
                        <div className="bg-card border border-border text-foreground p-3 rounded-xl text-xs leading-relaxed">
                          {c.a}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAskQuestion} className="flex gap-2">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Ask a question about this uploaded document..."
                    className="flex-1 px-3.5 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={askMutation.isPending || !userQuestion.trim()}
                    className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl disabled:opacity-50"
                  >
                    {askMutation.isPending ? "Searching document..." : "Ask AI"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
