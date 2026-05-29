import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../api/client";
import { pickAnswer } from "../components/night/echoAnswers";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const PLACEHOLDERS = ["关于他", "关于未来", "关于遗憾", "关于自己", "关于孤独", "关于成长"];

const STYLES = [
  { id: "gentle", label: "温柔", color: "#f9a8d4" },
  { id: "sober", label: "清醒", color: "#94a3b8" },
  { id: "philosophy", label: "哲学", color: "#a78bfa" },
  { id: "late_night", label: "深夜", color: "#7dd3fc" },
  { id: "hope", label: "希望", color: "#fbbf24" },
];

type EchoResult = { answer: string; whisper: string; tags: string[] } | null;

export default function EchoPage() {
  const [question, setQuestion] = useState("");
  const [style, setStyle] = useState("late_night");
  const [result, setResult] = useState<EchoResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [revealState, setRevealState] = useState<"idle" | "dimming" | "revealing" | "done">("idle");
  const [visibleChars, setVisibleChars] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // 逐字显示
  useEffect(() => {
    if (revealState !== "revealing" || !result) return;
    const text = result.answer;
    if (visibleChars >= text.length) {
      setRevealState("done");
      return;
    }
    const timer = setTimeout(() => {
      setVisibleChars((n) => Math.min(n + 1, text.length));
    }, 60 + Math.random() * 40); // 微随机速度
    return () => clearTimeout(timer);
  }, [revealState, visibleChars, result]);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRevealState("idle");
    setVisibleChars(0);

    const API_TIMEOUT = 30000;

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
      return { answer: local.answer, whisper: local.whisper, tags: local.tags };
    };

    try {
      const data = await Promise.race([apiCall, timeout]);
      setResult(data);
    } catch {
      const data = await localFallback();
      setResult(data);
    } finally {
      setLoading(false);
      // 启动意识浮现序列
      setTimeout(() => setRevealState("dimming"), 200);
      setTimeout(() => setRevealState("revealing"), 600);
    }
  }, [question, style, loading]);

  const reset = () => {
    setResult(null);
    setQuestion("");
    setError(null);
    setRevealState("idle");
    setVisibleChars(0);
    inputRef.current?.focus();
  };

  const activeStyle = STYLES.find((s) => s.id === style) || STYLES[3];

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* ═══════════════════════════════════════════
          背景 — 深夜宇宙
          ═══════════════════════════════════════════ */}
      {/* 深空底色 */}
      <div
        className="absolute inset-0 transition-[background] duration-[1.8s]"
        style={{ background: "var(--bg-deep)" }}
      />

      {/* 星空 dots (CSS-only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const size = Math.random() * 2.5 + 0.5;
          return (
            <div
              key={i}
              className="star-dot absolute"
              style={{
                width: size,
                height: size,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          );
        })}
        {/* 大星点 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`lg-${i}`}
            className="star-dot-lg absolute"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${5 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* 深空光球 */}
      <div className="deep-space-orb deep-space-orb-moon absolute -top-[15%] right-[10%] w-[50%] h-[50%]" />
      <div className="deep-space-orb deep-space-orb-warm absolute -bottom-[10%] left-[5%] w-[45%] h-[45%]" />

      {/* ── 主内容 ── */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-center mb-10"
        >
          {/* CSS 月亮装饰 */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-5 w-14 h-14 rounded-full relative"
            style={{
              background: "var(--bg-glass)",
              border: "0.5px solid var(--card-border)",
              boxShadow: "0 0 40px -8px var(--breathing-color)",
            }}
          >
            {/* 书页符号 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
              <div className="absolute w-0.5 h-4 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
            </div>
          </motion.div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            ECHO 答案之书
          </h1>
          <p className="mt-3 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
            在心里默念你的问题，然后翻开这一页
          </p>
        </motion.div>

        {/* 问题输入 — 超大玻璃拟态 */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: easeOut }}
            >
              <div className="glass-heavy rounded-3xl px-8 py-7 mb-6 relative overflow-hidden">
                {/* 顶部微光 */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                  style={{
                    background: "linear-gradient(90deg, transparent, var(--accent-400), transparent)",
                    opacity: 0.2,
                  }}
                />

                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={PLACEHOLDERS[placeholderIdx]}
                  maxLength={200}
                  className="w-full bg-transparent text-center text-xl sm:text-2xl
                             placeholder:opacity-30 focus:outline-none
                             transition-all duration-500"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "0.05em",
                  }}
                />

                {/* 风格选择器 — 月光胶囊 */}
                <div className="flex justify-center gap-2 sm:gap-3 mt-6 flex-wrap">
                  {STYLES.map((s) => (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStyle(s.id)}
                      className="relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                      style={{
                        color: style === s.id ? s.color : "var(--text-tertiary)",
                        background: style === s.id
                          ? `${s.color}12`
                          : "var(--bg-glass)",
                        border: style === s.id
                          ? `1px solid ${s.color}30`
                          : "0.5px solid var(--border-light)",
                        boxShadow: style === s.id
                          ? `0 0 20px -6px ${s.color}20`
                          : "none",
                      }}
                    >
                      {/* CSS dot indicator */}
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ background: s.color, opacity: style === s.id ? 1 : 0.4 }}
                      />
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm mb-4"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {error}
                </motion.p>
              )}

              {/* CTA 按钮 */}
              <div className="text-center mb-10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSubmit}
                  disabled={!question.trim() || loading}
                  className="btn-luminous text-base px-12 py-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? "倾听中..." : "翻开这一页"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════
               答案展示 — 意识浮现
               ═══════════════════════════════════════════ */
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              {/* 暗淡过渡 */}
              {revealState === "dimming" && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 mx-auto rounded-full"
                  style={{
                    background: "var(--bg-glass)",
                    border: "0.5px solid var(--card-border)",
                    boxShadow: "0 0 30px -10px var(--breathing-color)",
                  }}
                />
              )}

              {/* 答案浮现 */}
              {(revealState === "revealing" || revealState === "done") && result && (
                <motion.div
                  initial={{ opacity: 0, filter: "blur(16px)", transform: "translateY(12px) scale(0.96)" }}
                  animate={{ opacity: 1, filter: "blur(0)", transform: "translateY(0) scale(1)" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-heavy rounded-3xl px-10 py-10 max-w-xl mx-auto relative overflow-hidden"
                >
                  {/* 光晕扩散 */}
                  <div className="glow-expand-ring" />

                  {/* 主答案 — 逐字显示 */}
                  <p
                    className="font-serif text-xl sm:text-2xl leading-relaxed tracking-wider italic relative z-10"
                    style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
                  >
                    "
                    {result.answer.split("").map((char, i) => (
                      <span
                        key={i}
                        className="reveal-char"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {char}
                      </span>
                    ))}
                    "
                  </p>

                  {/* Whisper */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="mt-5 text-sm italic leading-relaxed tracking-wide relative z-10"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {result.whisper}
                  </motion.p>

                  {/* Tags */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-2 mt-5 relative z-10"
                  >
                    {result.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[11px] tracking-wider"
                        style={{
                          background: "var(--bg-glass)",
                          border: "0.5px solid var(--border-light)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </motion.div>

                  {/* 再问一次 */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.6 }}
                    onClick={reset}
                    className="mt-8 text-xs transition-colors relative z-10"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    再问一次
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
