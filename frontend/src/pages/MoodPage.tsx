import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMoodStore } from "../stores/useMoodStore";
import { MOOD_EMOJIS, MOOD_LABELS, type MoodEntry } from "../types/mood";
import { cn } from "../utils/cn";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

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
        <h1 className="font-serif text-2xl font-medium text-slate-200 tracking-tight">
          情绪日记
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          记录此刻的心情，每一个感受都值得被看见
        </p>
      </motion.div>

      {/* Score selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: easeOut }}
        className="mb-8"
      >
        <p className="text-sm text-slate-400 mb-4">
          {submitted ? "今日已记录" : "今天感觉怎么样？"}
        </p>
        <div className="flex justify-between items-center">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
            <motion.button
              key={val}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => !submitted && setScore(val)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300",
                score === val && "scale-110",
                submitted && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all duration-300 border",
                  score === val
                    ? "bg-white/[0.1] border-white/[0.15] shadow-glow-sm"
                    : "bg-white/[0.03] border-white/[0.04]"
                )}
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                {MOOD_EMOJIS[val]}
              </div>
              <span
                className={cn(
                  "text-[11px] transition-colors",
                  score === val ? "text-slate-300" : "text-slate-600"
                )}
              >
                {val}
              </span>
            </motion.button>
          ))}
        </div>
        {score && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-slate-300 mt-4 text-sm"
          >
            {MOOD_EMOJIS[score]} {MOOD_LABELS[score]}
          </motion.p>
        )}
      </motion.div>

      {/* Note input */}
      {!submitted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: easeOut }}
          className="mb-8"
        >
          <div
            className="relative rounded-3xl p-6 border border-white/[0.06] bg-white/[0.02]"
            style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          >
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none opacity-[0.015]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,0.3) 31px, rgba(255,255,255,0.3) 32px)",
              }}
            />
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-moon-400/[0.03] blur-3xl pointer-events-none" />

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="今天有什么留在心里吗？"
              rows={4}
              maxLength={2000}
              className="relative z-10 w-full resize-none bg-transparent text-slate-300
                         placeholder:text-slate-600 focus:outline-none
                         leading-relaxed text-base"
            />
          </div>

          {error && (
            <p className="text-rose-300 text-sm mt-3 bg-rose-500/10 px-4 py-2.5 rounded-xl">
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
              className="btn-glow px-10 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
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
          <p className="text-sm text-slate-400 mb-3">已记录 ✨</p>
          <button
            onClick={handleReset}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            再记录一次
          </button>
        </motion.div>
      )}

      {/* History section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="space-y-6"
      >
        {/* Trends bar */}
        {trends && (
          <div className="glass rounded-2xl p-5 card-texture">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
              近期情绪趋势（{trends.total_entries}次记录）
            </p>
            <div className="flex items-end gap-1 h-20">
              {trends.entries.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.6 + i * 0.04, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex-1 rounded-full bg-gradient-to-t from-moon-500/40 to-lavender-400/40 origin-bottom relative group"
                  style={{ height: `${(point.score / 10) * 100}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/[0.08] border border-white/[0.08] rounded-lg px-2 py-0.5
                                  text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {point.date} · {point.label || `${point.score}`}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-600">
              <span>7天前</span>
              <span>均分 {trends.average.toFixed(1)}</span>
              <span>今天</span>
            </div>
          </div>
        )}

        {/* Today's entries */}
        {todayEntries.length > 0 && (
          <div className="glass rounded-2xl p-5 card-texture">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
              今日记录
            </p>
            <div className="space-y-3">
              {todayEntries.map((entry: MoodEntry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]"
                >
                  <span className="text-xl shrink-0 mt-0.5">{MOOD_EMOJIS[entry.mood_score]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">{MOOD_LABELS[entry.mood_score]}</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(entry.recorded_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {entry.journal_text && (
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {entry.journal_text}
                      </p>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{entry.mood_score}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
