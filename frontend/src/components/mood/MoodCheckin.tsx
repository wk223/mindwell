import { useState, useEffect } from "react";
import { useMoodStore } from "../../stores/useMoodStore";
import { MOOD_EMOJIS, MOOD_LABELS } from "../../types/mood";
import { cn } from "../../utils/cn";

const COMMON_TAGS = ["工作", "家庭", "健康", "人际关系", "学业", "经济", "睡眠", "饮食", "运动"];

export default function MoodCheckin() {
  const todayEntry = useMoodStore((s) => s.todayEntry);
  const isSubmitting = useMoodStore((s) => s.isSubmitting);
  const error = useMoodStore((s) => s.error);
  const submitCheckin = useMoodStore((s) => s.submitCheckin);
  const loadToday = useMoodStore((s) => s.loadToday);
  const clearError = useMoodStore((s) => s.clearError);

  const [score, setScore] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (todayEntry) {
      setScore(todayEntry.mood_score);
      setJournal(todayEntry.journal_text || "");
      setSelectedTags(todayEntry.tags || []);
      setSubmitted(true);
    }
  }, [todayEntry]);

  const handleSubmit = async () => {
    if (score === null) return;
    await submitCheckin(score, MOOD_LABELS[score], journal || undefined, selectedTags);
    setSubmitted(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-base font-semibold text-slate-200 mb-1">
        {submitted ? "今日心情" : "今天感觉怎么样？"}
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        {submitted ? "你已完成今日打卡" : "选择一个最能代表你此刻心情的表情"}
      </p>

      <div className="flex justify-between items-center mb-6">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
          <button
            key={val}
            onClick={() => {
              if (!submitted) setScore(val);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
              score === val
                ? "scale-125 bg-white/[0.1] ring-2 ring-moon-400/50"
                : "hover:scale-110 hover:bg-white/[0.05]",
              submitted && "cursor-default"
            )}
            title={MOOD_LABELS[val]}
          >
            <span className="text-2xl">{MOOD_EMOJIS[val]}</span>
            <span className="text-xs text-slate-500">{val}</span>
          </button>
        ))}
      </div>

      {score && (
        <p className="text-center text-slate-300 font-medium mb-4">
          {MOOD_EMOJIS[score]} {MOOD_LABELS[score]}
        </p>
      )}

      {!submitted && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-400 mb-2">影响因素（可选）</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-moon-400/20 text-moon-300 border border-moon-400/30"
                      : "bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:bg-white/[0.08]"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-slate-400 mb-2">心情日记（可选）</p>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="写下你想记录的..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm resize-none
                         text-slate-200 placeholder:text-slate-600
                         focus:outline-none focus:ring-2 focus:ring-moon-400/30 focus:border-transparent
                         transition-all"
            />
          </div>

          {error && (
            <p className="text-rose-300 text-sm mb-3 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-400/15">
              {error}
              <button onClick={clearError} className="ml-2 underline hover:text-rose-200">关闭</button>
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="w-full py-2.5 rounded-2xl bg-moon-400/90 text-void-900 text-sm font-medium
                       hover:bg-moon-400 active:bg-moon-500
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-md"
          >
            {isSubmitting ? "提交中..." : "记录心情"}
          </button>
        </>
      )}
    </div>
  );
}
