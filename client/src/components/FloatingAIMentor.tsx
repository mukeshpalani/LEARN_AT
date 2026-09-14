import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Sparkles, X, Send, Bot, User, MessageSquare, Lightbulb, Code2 } from "lucide-react";
import { Streamdown } from "streamdown";

interface FloatingAIMentorProps {
  pageContext?: string;
  initialMessage?: string;
}

export default function FloatingAIMentor({ pageContext = "General Dashboard", initialMessage }: FloatingAIMentorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: initialMessage || `👋 Hi! I'm your **Personal AI Learning Mentor**. I see you are on **${pageContext}**. Ask me for hints, concepts, practice feedback, or code help!`,
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble generating a response. Please try again." },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setInput("");

    // Call tRPC AI chat
    chatMutation.mutate({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      pageContext,
    });
  };

  const quickPrompts = [
    "Give me a hint on this",
    "Explain this concept simply",
    "Quiz me on what I'm learning",
    "Help debug my code",
  ];

  return (
    <>
      {/* Floating Circular Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 size-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 transition-all flex items-center justify-center z-50 group border-2 border-background"
        title="Open AI Mentor"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-green-500 ring-2 ring-background" />
      </button>

      {/* Slide-out Right Mini Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-foreground">AI Learning Mentor</h3>
                <span className="text-[10px] text-muted-foreground block">
                  Context: <strong className="text-primary">{pageContext}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  <Streamdown>{m.content}</Streamdown>
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <Sparkles size={14} className="animate-spin text-primary" />
                <span>Mentor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-muted/40 border-t border-border flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInput(prompt);
                }}
                className="px-2 py-1 bg-card hover:bg-muted border border-border rounded-md text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for hints, concepts, or code guidance..."
              className="flex-1 px-3 py-2 bg-background border border-input rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
