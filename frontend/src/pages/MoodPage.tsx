import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMoodStore } from "../stores/useMoodStore";
import { MOOD_EMOJIS, MOOD_LABELS, type MoodEntry } from "../types/mood";
import { cn } from "../utils/cn";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

/** 分数对应的 CSS 渐变色（用于情绪球） */
const SCORE_COLORS: Record<number, string> = {
  1: "#64748b", 2: "#64748b",
  3: "#7c3aed", 4: "#7c3aed",
  5: "#38bdf8", 6: "#38bdf8",
  7: "#4ade80", 8: "#4ade80",
  9: "#fbbf24", 10: "#fbbf24",
};

export default function MoodPage() {
  const todayEntry = useMoodStore((s) => s.todayEntry);
  const todayEntries = useMoodStore((s) => s.todayEntries);
  const trends = useMoodStore((s) => s.trends);
  const isSubmitting = useMoodStore((s) => s.isSubmitting);
  const error = useMoodStore((s) => s.error);
  const submitCheckin = useMoodStore((s) => s.submitCheckin);
  const loadToday = useMoodStore((s) => s.loadToday);
  const loadTodayEntries = useMoodStore((s) => s.loadTodayEntries);
  const loadTrends = useMoodStore((s) => s.loadTrends);
  const clearError = useMoodStore((s) => s.clearError);

  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadToday();
    loadTodayEntries();
    loadTrends("weekly");
  }, [loadToday, loadTodayEntries, loadTrends]);

  useEffect(() => {
    if (todayEntry) {
      setScore(todayEntry.mood_score);
      setNote(todayEntry.journal_text || "");
      setSubmitted(true);
    }
  }, [todayEntry]);

  const handleSave = async () => {
    if (score === null) return;
    await submitCheckin(score, MOOD_LABELS[score], note || undefined);
    setSubmitted(true);
    loadTodayEntries();
    loadTrends("weekly");
  };

  const handleReset = () => {
    setScore(null);
    setNote("");
    setSubmitted(false);
    clearError();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="mb-10"
      >
        <h1 className="font-serif text-2xl font-medium tracking-tight" style={{ color: "var(--text-primary)" }}>
          情绪日记
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          记录此刻的心情，每一个感受都值得被看见
        </p>
      </motion.div>

      {/* ── 情绪球选择器 ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: easeOut }}
        className="mb-8"
      >
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          {submitted ? "今日已记录" : "今天感觉怎么样？"}
        </p>
        <div className="flex justify-between items-center">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
            const color = SCORE_COLORS[val];
            const isSelected = score === val;
            return (
              <motion.button
                key={val}
                whileHover={{ scale: 1.2, y: -6 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => !submitted && setScore(val)}
                disabled={submitted}
                className="emotion-orb flex flex-col items-center justify-center gap-1"
                style={{
                  width: 42,
                  height: 42,
                  background: isSelected
                    ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, ${color}50 60%, transparent 100%)`
                    : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, ${color}18 60%, transparent 100%)`,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${color}40, 0 6px 24px -6px ${color}40`
                    : `0 2px 12px -4px ${color}15`,
                  animationDelay: `${val * 0.15}s`,
                  cursor: submitted ? "default" : "pointer",
                }}
                title={MOOD_LABELS[val]}
              >
                <span className="text-xs leading-none">{MOOD_EMOJIS[val]}</span>
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: isSelected ? color : "var(--text-tertiary)" }}
                >
                  {val}
                </span>
              </motion.button>
            );
          })}
        </div>
        {score && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-5 text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {MOOD_LABELS[score]}
          </motion.p>
        )}
      </motion.div>

      {/* ── 纸条风格输入 ── */}
      {!submitted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: easeOut }}
          className="mb-8"
        >
          <div className="memo-paper p-6 relative overflow-hidden">
            {/* 柔光 accent */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, color-mix(in srgb, var(--accent-400) 4%, transparent) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="今天有什么留在心里吗？"
              rows={4}
              maxLength={2000}
              className="relative z-10 w-full resize-none bg-transparent
                         focus:outline-none leading-relaxed text-base"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {error && (
            <p
              className="text-sm mt-3 px-4 py-2.5 rounded-xl glass-light"
              style={{ color: "var(--text-secondary)" }}
            >
              {error}
              <button onClick={clearError} className="ml-2 underline">关闭</button>
            </p>
          )}

          <div className="text-center mt-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={score === null || isSubmitting}
              className="btn-luminous px-10 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "记录中..." : "记录下来"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>已记录</p>
          <button
            onClick={handleReset}
            className="text-xs transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            再记录一次
          </button>
        </motion.div>
      )}

      {/* ── 历史区域 ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="space-y-5"
      >
        {/* 趋势图 */}
        {trends && (
          <div className="glass-surface p-5">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              近期情绪趋势（{trends.total_entries}次记录）
            </p>
            <div className="flex items-end gap-1 h-20">
              {trends.entries.map((point, i) => {
                const color = SCORE_COLORS[Math.round(point.score)] || SCORE_COLORS[5];
                return (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.6 + i * 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className="flex-1 rounded-full origin-bottom relative group"
                    style={{
                      height: `${(point.score / 10) * 100}%`,
                      background: `linear-gradient(to top, ${color}40, ${color}15)`,
                    }}
                  >
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg px-2 py-0.5
                                 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                      style={{
                        background: "var(--bg-glass)",
                        border: "0.5px solid var(--border-light)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {point.date} · {point.label || `${point.score}`}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              <span>7天前</span>
              <span>均分 {trends.average.toFixed(1)}</span>
              <span>今天</span>
            </div>
          </div>
        )}

        {/* 今日记录 */}
        {todayEntries.length > 0 && (
          <div className="glass-surface p-5">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              今日记录
            </p>
            <div className="space-y-3">
              {todayEntries.map((entry: MoodEntry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "var(--bg-glass)",
                    border: "0.5px solid var(--border-light)",
                  }}
                >
                  {/* CSS 情绪 dot */}
                  <div
                    className="w-8 h-8 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-xs font-medium"
                    style={{
                      background: `${SCORE_COLORS[entry.mood_score]}20`,
                      color: SCORE_COLORS[entry.mood_score],
                      border: `1px solid ${SCORE_COLORS[entry.mood_score]}30`,
                    }}
                  >
                    {entry.mood_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {MOOD_LABELS[entry.mood_score]}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(entry.recorded_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {entry.journal_text && (
                      <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {entry.journal_text}
                      </p>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--bg-glass)",
                              border: "0.5px solid var(--border-light)",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
