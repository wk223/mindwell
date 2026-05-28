import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMoodStore } from "../stores/useMoodStore";
import { MOOD_EMOJIS, MOOD_LABELS } from "../types/mood";
import { cn } from "../utils/cn";
import EmotionBubbleSelector from "../components/mood/EmotionBubbleSelector";
import MoodCalendar from "../components/mood/MoodCalendar";
import MoodTimeline from "../components/mood/MoodTimeline";
import BeijingClock from "../components/mood/BeijingClock";
import MoonIcon from "../components/shared/MoonIcon";

const COMMON_TAGS = ["工作", "家庭", "健康", "人际关系", "学业", "经济", "睡眠", "饮食", "运动"];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });
}

export default function GrowthPage() {
  const navigate = useNavigate();
  const todayEntries = useMoodStore((s) => s.todayEntries);
  const stats = useMoodStore((s) => s.stats);
  const calendar = useMoodStore((s) => s.calendar);
  const isSubmitting = useMoodStore((s) => s.isSubmitting);
  const error = useMoodStore((s) => s.error);
  const loadTodayEntries = useMoodStore((s) => s.loadTodayEntries);
  const loadStats = useMoodStore((s) => s.loadStats);
  const loadCalendar = useMoodStore((s) => s.loadCalendar);
  const submitCheckin = useMoodStore((s) => s.submitCheckin);
  const clearError = useMoodStore((s) => s.clearError);

  const [score, setScore] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    loadTodayEntries();
    loadStats();
    loadCalendar(28);
  }, [loadTodayEntries, loadStats, loadCalendar]);

  const handleSubmit = useCallback(async () => {
    if (score === null) return;
    await submitCheckin(score, MOOD_LABELS[score], journal || undefined, selectedTags);
    setJustSubmitted(true);
    setScore(null);
    setJournal("");
    setSelectedTags([]);
    loadTodayEntries();
    loadCalendar(28);
    loadStats();
    setTimeout(() => setJustSubmitted(false), 2000);
  }, [score, journal, selectedTags, submitCheckin, loadTodayEntries, loadCalendar, loadStats]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">自助成长</h1>
            <p className="text-sm text-gray-500 mt-1">情绪日记 · 心情追踪 · 自我觉察</p>
          </div>
          <BeijingClock />
        </div>

        {/* 1. Quick Check-in — always available */}
        <div className="card-primary paper-texture">
          <h2 className="text-base font-semibold text-gray-800 mb-1">此刻心情</h2>
          <p className="text-sm text-gray-500 mb-4">随时记录你的真实感受</p>

          <EmotionBubbleSelector score={score} onSelect={setScore} />

          <div className="mt-5 space-y-3">
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="想说点什么...（可选）"
              rows={2}
              maxLength={2000}
              className="input-underline resize-none text-sm"
              style={{ background: "transparent" }}
            />

            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-mint-100 text-mint-700 border border-mint-200"
                      : "bg-white/50 text-gray-500 border border-cream-200 hover:bg-white"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl flex items-center justify-between">
                {error}
                <button onClick={clearError} className="text-xs underline ml-2">关闭</button>
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={score === null || isSubmitting}
              className="btn-heal w-full text-sm"
            >
              {isSubmitting ? "记录中..." : justSubmitted ? "已记录 ✓" : "记录此刻"}
            </button>
          </div>
        </div>

        {/* 2. Today's mood timeline */}
        {todayEntries.length > 0 && (
          <div className="card-secondary">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">今天的心情变化</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {todayEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 bg-cream-50 rounded-2xl border border-cream-200"
                >
                  <span className="text-xl">{MOOD_EMOJIS[entry.mood_score]}</span>
                  <div className="text-xs">
                    <p className="text-gray-400">{formatTime(entry.created_at)}</p>
                    <p className="font-medium text-gray-700">{entry.mood_score}/10</p>
                  </div>
                  {i < todayEntries.length - 1 && (
                    <span className="text-gray-300 text-xs mx-1">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Stats Row + Calendar side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stats */}
          {stats && (
            <div className="card-secondary space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">数据概览</h3>
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="总打卡" value={`${stats.total_checkins}次`} />
                <MiniStat label="平均分" value={`${stats.average_score}`} />
                <MiniStat label="连续" value={`${stats.current_streak}天`} />
                <MiniStat label="常见" value={stats.most_common_label || "--"} />
              </div>
            </div>
          )}

          {/* Compact Calendar */}
          <div className="card-secondary sm:col-span-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">心情日历</h3>
            <MoodCalendar entries={calendar} compact />
          </div>
        </div>

        {/* 4. Recent Timeline */}
        <div className="card-primary">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">最近记录</h3>
          <MoodTimeline entries={calendar} />
        </div>

        {/* 5. AI Companion Bridge */}
        <div className="card-secondary" style={{ background: "linear-gradient(135deg, rgba(141,200,176,0.08), rgba(173,156,213,0.06))" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center shadow-soft shrink-0">
              <MoonIcon size={22} glowing />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-sm mb-1">AI 情绪伙伴</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                想更深入地理解自己的情绪？和 MindWell AI 聊聊你的感受。
              </p>
              <button
                onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-purple-200
                           text-xs font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300
                           transition-all shadow-soft"
              >
                开始对话
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="card-tertiary text-sm" style={{ background: "rgba(253,239,242,0.3)" }}>
          <p className="text-xs leading-relaxed text-gray-500">情绪日记是自我觉察的工具，不构成专业心理诊断。如有持续的情绪困扰，建议寻求专业帮助。</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-cream-50 rounded-xl">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}
