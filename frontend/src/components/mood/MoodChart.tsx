import { useState, useEffect } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useMoodStore } from "../../stores/useMoodStore";
import { MOOD_EMOJIS } from "../../types/mood";
import { cn } from "../../utils/cn";

export default function MoodChart() {
  const trends = useMoodStore((s) => s.trends);
  const stats = useMoodStore((s) => s.stats);
  const loadTrends = useMoodStore((s) => s.loadTrends);
  const loadStats = useMoodStore((s) => s.loadStats);
  const todayEntry = useMoodStore((s) => s.todayEntry);

  const [range, setRange] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    loadTrends(range);
    loadStats();
  }, [range, loadTrends, loadStats]);

  const chartData = trends?.entries.map((e) => ({
    ...e,
    displayDate: new Date(e.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    emoji: MOOD_EMOJIS[Math.round(e.score)] || "",
  })) || [];

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="总打卡" value={`${stats.total_checkins} 次`} />
          <StatCard label="平均心情" value={`${stats.average_score} 分`} />
          <StatCard label="连续打卡" value={`${stats.current_streak} 天`} />
          <StatCard label="最常见" value={stats.most_common_label || "--"} />
        </div>
      )}

      <div className="flex items-center gap-1 bg-cream-100 rounded-2xl p-1 w-fit">
        {["weekly", "monthly"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r as "weekly" | "monthly")}
            className={cn(
              "px-4 py-1.5 rounded-xl text-xs font-medium transition-colors",
              range === r ? "bg-white text-gray-800 shadow-soft" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {r === "weekly" ? "本周" : "本月"}
          </button>
        ))}
      </div>

      <div className="glass-card p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8cd8b0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8cd8b0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 12, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white shadow-card border border-cream-200 rounded-2xl px-3 py-2 text-sm">
                      <p className="text-gray-500">{d.displayDate}</p>
                      <p className="font-semibold text-gray-800">{d.emoji} {d.score} 分</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="score" stroke="#5dc48d" strokeWidth={2} fill="url(#moodG)"
                dot={{ r: 3, fill: "#5dc48d", stroke: "white", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#3dab70" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p>暂无数据</p>
              <p className="text-sm mt-1">开始记录心情后可查看趋势图</p>
            </div>
          </div>
        )}
      </div>

      {todayEntry && (
        <div className="bg-gradient-to-r from-mint-50 to-cream-50 border border-mint-100 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-4xl">{MOOD_EMOJIS[todayEntry.mood_score]}</span>
          <div>
            <p className="font-medium text-gray-800">今日已打卡</p>
            <p className="text-sm text-gray-500">{todayEntry.mood_label} · {todayEntry.mood_score}/10</p>
            {todayEntry.journal_text && (
              <p className="text-sm text-gray-400 mt-1 truncate max-w-xs">"{todayEntry.journal_text}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
