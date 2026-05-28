import { useMemo } from "react";
import { MOOD_EMOJIS } from "../../types/mood";

interface CalendarEntry {
  date: string;
  score: number;
  label: string | null;
}

interface Props {
  entries: CalendarEntry[];
  compact?: boolean;
}

function beijingToday(): string {
  const now = new Date();
  const bj = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  return bj.toISOString().slice(0, 10);
}

function getColor(score: number): { bg: string; glow: string } {
  if (score >= 9) return { bg: "bg-emerald-400", glow: "0 0 8px rgba(52,211,153,0.5)" };
  if (score >= 7) return { bg: "bg-mint-400", glow: "0 0 8px rgba(93,196,141,0.5)" };
  if (score >= 5) return { bg: "bg-amber-400", glow: "0 0 8px rgba(251,191,36,0.5)" };
  if (score >= 3) return { bg: "bg-orange-400", glow: "0 0 8px rgba(251,146,60,0.5)" };
  return { bg: "bg-rose-400", glow: "0 0 8px rgba(251,113,133,0.5)" };
}

export default function MoodCalendar({ entries, compact }: Props) {
  const days = compact ? 14 : 28;
  const cellSize = compact ? "w-6 h-6" : "w-9 h-9";

  const { weeks, dayLabels } = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const e of entries) map.set(e.date, e);

    const bjNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
    const weeks: { date: string; entry: CalendarEntry | undefined; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; entry: CalendarEntry | undefined; dayOfWeek: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(bjNow);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      currentWeek.push({ date: dateStr, entry: map.get(dateStr), dayOfWeek });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, dayLabels: ["日", "一", "二", "三", "四", "五", "六"] };
  }, [entries, days]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <p className="text-xs">暂无记录，开始记录心情吧</p>
      </div>
    );
  }

  const todayStr = beijingToday();

  return (
    <div className={compact ? "flex gap-1" : "flex gap-2"}>
      {!compact && (
        <div className="flex flex-col gap-1.5 pt-0">
          {dayLabels.map((l) => (
            <span key={l} className="text-[10px] text-gray-400 w-9 h-9 flex items-center justify-center">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5 flex-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5 flex-1">
            {week.map((day) => {
              const colors = day.entry ? getColor(day.entry.score) : null;
              const isToday = day.date === todayStr;
              return (
                <div
                  key={day.date}
                  className={`relative ${cellSize} rounded-lg group transition-transform hover:scale-110`}
                  title={day.entry
                    ? `${day.date}\n${MOOD_EMOJIS[day.entry.score] || ""} ${day.entry.score}分 ${day.entry.label || ""}`
                    : day.date}
                  style={isToday && colors ? { boxShadow: colors.glow } : undefined}
                >
                  <div
                    className={`w-full h-full rounded-lg transition-colors ${
                      day.entry ? colors!.bg : "bg-gray-150"
                    } ${isToday ? "ring-2 ring-offset-1" : ""}`}
                    style={{
                      background: day.entry ? undefined : "rgba(0,0,0,0.04)",
                      ...(isToday ? { ringColor: "var(--accent-400, #5dc48d)" } : {}),
                    }}
                  />
                  {day.entry && !compact && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {day.date.slice(5)} · {MOOD_EMOJIS[day.entry.score]} {day.entry.score}分
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
