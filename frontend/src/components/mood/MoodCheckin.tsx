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
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        {submitted ? "今日心情" : "今天感觉怎么样？"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
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
                ? "scale-125 bg-mint-100 ring-2 ring-mint-300"
                : "hover:scale-110 hover:bg-cream-100",
              submitted && "cursor-default"
            )}
            title={MOOD_LABELS[val]}
          >
            <span className="text-2xl">{MOOD_EMOJIS[val]}</span>
            <span className="text-xs text-gray-400">{val}</span>
          </button>
        ))}
      </div>

      {score && (
        <p className="text-center text-gray-700 font-medium mb-4">
          {MOOD_EMOJIS[score]} {MOOD_LABELS[score]}
        </p>
      )}

      {!submitted && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">影响因素（可选）</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-mint-100 text-mint-700 border border-mint-200"
                      : "bg-cream-100 text-gray-500 border border-cream-200 hover:bg-cream-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">心情日记（可选）</p>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="写下你想记录的..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-2xl bg-cream-100 border border-cream-300 px-4 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-mint-300 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">
              {error}
              <button onClick={clearError} className="ml-2 underline">关闭</button>
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="w-full py-2.5 rounded-2xl bg-mint-500 text-white text-sm font-medium
                       hover:bg-mint-600 active:bg-mint-700
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
          >
            {isSubmitting ? "提交中..." : "记录心情"}
          </button>
        </>
      )}
    </div>
  );
}
