import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  MapPin,
  Bot,
  User,
  X,
  ExternalLink,
  Compass,
  Building,
  Loader2,
  HelpCircle,
} from "lucide-react";
import type { ChatMessage } from "@/server/gemini";

interface GroundingMetadata {
  groundingChunks?: Array<{
    web?: { uri: string; title: string };
    maps?: { uri?: string; title?: string; address?: string };
  }>;
  webSearchQueries?: string[];
  searchEntryPoint?: { renderedContent?: string };
}

interface MessageWithMeta extends ChatMessage {
  grounding?: GroundingMetadata | null;
}

const suggestedPrompts = [
  "أفضل الأحياء الهادئة للسكن في الجزائر العاصمة بالقرب من المترو والخدمات",
  "ما هي الإجراءات القانونية والأوراق لتوثيق عقد كراء شقة أو أرض في الجزائر؟",
  "قارن بين إيجار الشقق في وهران (حي النرجس، العقيد لطفي) وقسنطينة",
  "ما هي مميزات استئجار أرض فلاحية وما هي شروط دفتر الشروط؟",
];

export function GeminiAdvisorModal({
  isOpen,
  onClose,
  initialWilaya,
  propertyContext,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialWilaya?: string;
  propertyContext?: string;
}) {
  const [messages, setMessages] = useState<MessageWithMeta[]>([
    {
      role: "model",
      text: "مرحباً بك! أنا «مستشار منزلي وأرضي الذكي» المزود ببيانات خرائط Google Maps. يسعدني مساعدتك في استكشاف العقارات، أسعار الإيجار، الأحياء المناسبة، المواصلات والمرافق القريبة عبر كافة الـ 69 ولاية، بالإضافة إلى القوانين العقارية وتوثيق العقود. كيف يمكنني إفادتك اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: MessageWithMeta = { role: "user", text: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          wilaya: initialWilaya,
          propertyContext,
        }),
      });

      if (!res.ok) {
        throw new Error("فشل الاتصال بالمساعد الذكي");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply || "عذرًا، لم أتمكن من استخراج الإجابة بدقة.",
          grounding: data.groundingMetadata,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "تعذر الاتصال بالمستشار الذكي مؤقتًا. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجددًا.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-deep px-5 py-4 text-deep-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg">مستشار منزلي وأرضي الذكي</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  <MapPin size={11} /> خرائط Google مدعومة
                </span>
              </div>
              <p className="text-xs opacity-75">
                استشارات جغرافية، أسعار الإيجار، والأحياء في كامل ولايات الجزائر الـ 69
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-deep-foreground/80 hover:bg-white/10 hover:text-white"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gold text-deep"
                }`}
              >
                {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-secondary text-secondary-foreground rounded-tl-none border border-border/60"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Grounding metadata (Locations / Places / Sources from Google Maps) */}
                {m.grounding?.groundingChunks && m.grounding.groundingChunks.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-2.5">
                    <p className="flex items-center gap-1 text-xs font-bold text-primary mb-1.5">
                      <MapPin size={13} /> المواقع والخرائط المرتبطة:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.grounding.groundingChunks.map((chunk, cIdx) => {
                        const title = chunk.maps?.title || chunk.web?.title || "عرض في الخريطة";
                        const uri = chunk.maps?.uri || chunk.web?.uri;
                        if (!uri) return null;
                        return (
                          <a
                            key={cIdx}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary border border-border/80 transition"
                          >
                            <Compass size={12} className="text-primary" />
                            <span>{title}</span>
                            <ExternalLink size={10} className="opacity-60" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 p-3 rounded-xl w-fit">
              <Loader2 size={15} className="animate-spin text-primary" />
              <span>جاري استشارة الذكاء الاصطناعي والخرائط الجغرافية...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts (visible if conversation is short) */}
        {messages.length <= 3 && !loading && (
          <div className="border-t border-border/60 bg-muted/40 p-3">
            <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-2">
              <HelpCircle size={13} /> أسئلة مقترحة سريعة:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="rounded-lg bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-gold-soft hover:text-deep border border-border/80 transition text-right"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-border bg-card p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب استفسارك عن أي عقار، حي، ولاية أو تفاصيل الإيجار..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              title="إرسال"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating launcher button for the advisor that appears on all screens
 */
export function GeminiAdvisorFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-deep px-4 py-3 text-gold shadow-2xl border-2 border-gold/40 hover:scale-105 active:scale-95 transition-all duration-200"
        title="مستشارك العقاري الذكي مع خرائط Google"
      >
        <Sparkles size={18} className="text-gold" />
        <span className="text-xs font-bold text-white hidden sm:inline">
          مستشار منزلي وأرضي الذكي
        </span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
      </button>

      <GeminiAdvisorModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
