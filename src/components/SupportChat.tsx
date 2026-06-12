import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "How do I connect my broker?",
  "What plans are available?",
  "How do signals work?",
  "How do I get WhatsApp alerts?",
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm the GloriousFX support assistant. Ask me anything about our platform, signals, or subscriptions — or email us at glorious.support@gmail.com for personalised help.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please email us at glorious.support@gmail.com and we'll help you shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${open ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        style={{ background: "linear-gradient(135deg, #FFD700, #cc9f00)", boxShadow: "0 0 16px rgba(255,215,0,0.5)" }}
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6 text-black" />
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl border border-primary/30 bg-[#0d0d0d] shadow-2xl transition-all duration-300 origin-bottom-right ${open ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
        style={{ height: 520, boxShadow: "0 0 30px rgba(255,215,0,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl border-b border-border/40" style={{ background: "linear-gradient(90deg, #1a1400, #0d0d0d)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD700, #cc9f00)" }}>
              <MessageCircle className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">GloriousFX Support</p>
              <p className="text-xs text-primary">AI assistant · always online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "text-black rounded-br-sm"
                    : "bg-white/5 text-foreground border border-border/30 rounded-bl-sm"
                }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg, #FFD700, #e6c200)" } : {}}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-border/30 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs border border-primary/40 text-primary rounded-full px-3 py-1 hover:bg-primary/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Email link */}
        <div className="px-4 pb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="w-3 h-3 text-primary" />
          <a href="mailto:glorious.support@gmail.com" className="text-primary hover:underline">
            glorious.support@gmail.com
          </a>
        </div>

        {/* Input */}
        <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-border/40">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask a question…"
            className="flex-1 bg-white/5 border-border/40 text-sm focus-visible:ring-primary/50"
            disabled={loading}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 bg-primary hover:bg-primary/90 text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
