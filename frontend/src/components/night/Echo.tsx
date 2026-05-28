import { useState, useCallback, useRef } from "react";
import { apiRequest } from "../../api/client";
import NightButton from "./NightButton";
import { pickAnswer } from "./echoAnswers";

const PLACEHOLDERS = ["关于他", "关于未来", "关于遗憾", "关于自己", "关于孤独", "关于成长"];
const STYLES = [
  { id: "gentle", label: "温柔", emoji: "🌸", color: "#f9a8d4" },
  { id: "sober", label: "清醒", emoji: "🌑", color: "#94a3b8" },
  { id: "philosophy", label: "哲学", emoji: "🌌", color: "#a78bfa" },
  { id: "late_night", label: "深夜", emoji: "🌧", color: "#38bdf8" },
  { id: "hope", label: "希望", emoji: "✨", color: "#fbbf24" },
];

type EchoResult = { answer: string; whisper: string; tags: string[] } | null;

export default function Echo() {
  const [question, setQuestion] = useState("");
  const [style, setStyle] = useState("late_night");
  const [result, setResult] = useState<EchoResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const placeholderTimer = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder
  useState(() => {
    placeholderTimer.current = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(placeholderTimer.current);
  });

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const API_TIMEOUT = 3000;

    const apiCall = apiRequest<{
      answer: string;
      whisper: string;
      tags: string[];
    }>("/night/echo", {
      method: "POST",
      body: JSON.stringify({ question: question.trim(), style }),
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), API_TIMEOUT)
    );

    const localFallback = async () => {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
      const local = pickAnswer(style);
      return { answer: local.answer, whisper: local.whisper, tags: [question.trim()] };
    };

    try {
      const data = await Promise.race([apiCall, timeout]);
      setResult(data);
    } catch {
      const data = await localFallback();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, [question, style, loading]);

  const reset = () => {
    setResult(null);
    setQuestion("");
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6">
      {!result ? (
        <>
          {/* Question input area */}
          <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-8 animate-night-fade-in tracking-wider">
            别急，答案会慢慢浮上来。
          </p>

          <div className="w-full max-w-lg lg:max-w-2xl night-glass-input rounded-3xl px-6 sm:px-8 py-5 sm:py-6 mb-6 animate-night-fade-in-up">
            <input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              maxLength={200}
              className="w-full bg-transparent text-slate-200 text-lg sm:text-xl lg:text-2xl text-center placeholder:text-slate-400
                         focus:outline-none transition-all duration-500"
              style={{ letterSpacing: "0.05em" }}
            />
          </div>

          {/* Style selector */}
          <div className="flex items-center gap-2 sm:gap-3 mb-8 animate-night-fade-in">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className="night-style-dot flex flex-col items-center gap-1 px-2.5 sm:px-3 py-2 rounded-2xl transition-all duration-300"
                style={{
                  color: style === s.id ? s.color : "#94a3b8",
                  background: style === s.id ? `${s.color}15` : "transparent",
                }}
              >
                <span className="text-base sm:text-lg">{s.emoji}</span>
                <span className="text-[10px] sm:text-xs tracking-wider">{s.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-rose-400/80 text-sm mb-4 animate-night-fade-in">{error}</p>
          )}

          <NightButton
            variant="echo"
            onClick={handleSubmit}
            disabled={!question.trim() || loading}
          >
            <span className="text-lg mr-1">📖</span>
            {loading ? "倾听中..." : "翻开这一页"}
            <span className="text-slate-500 text-xs ml-1">→</span>
          </NightButton>
        </>
      ) : (
        <>
          {/* Result display */}
          <div className="w-full max-w-lg lg:max-w-2xl text-center space-y-6 sm:space-y-8 night-echo-answer">
            {/* Main answer */}
            <div className="space-y-4">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light text-slate-100 leading-relaxed tracking-wider"
                 style={{ letterSpacing: "0.08em" }}>
                {result.answer}
              </p>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto" />
            </div>

            {/* Whisper */}
            <p className="text-sm sm:text-base text-slate-400 italic leading-relaxed tracking-wide">
              {result.whisper}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-[11px] sm:text-xs tracking-wider
                             bg-white/5 border border-white/10 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8 sm:mt-10 animate-night-fade-in">
            <NightButton variant="secondary" onClick={reset}>
              ↺ 再问一次
            </NightButton>
          </div>
        </>
      )}
    </div>
  );
}
