import { MOOD_EMOJIS } from "../../types/mood";
import type { MoodCalendarEntry } from "../../types/mood";

interface Props {
  entries: MoodCalendarEntry[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  const bjNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const todayStr = bjNow.toISOString().slice(0, 10);
  const yesterdayStr = new Date(new Date(bjNow).setDate(bjNow.getDate() - 1)).toISOString().slice(0, 10);
  const twoDaysAgoStr = new Date(new Date(bjNow).setDate(bjNow.getDate() - 2)).toISOString().slice(0, 10);

  if (dateStr === todayStr) return "今天";
  if (dateStr === yesterdayStr) return "昨天";
  if (dateStr === twoDaysAgoStr) return "前天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function MoodTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-sm mb-1">还没有心情记录</p>
        <p className="text-xs">记录下你的第一份心情日记吧</p>
      </div>
    );
  }

  const recent = [...entries].reverse().slice(0, 14);

  return (
    <div className="river-timeline">
      {recent.map((entry, i) => (
        <div
          key={entry.date}
          className={`river-entry ${i % 2 === 0 ? "left" : "right"}`}
        >
          <div className="river-node" />
          <div className="card-secondary px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{MOOD_EMOJIS[entry.score] || "😐"}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                  <span className="text-sm font-semibold text-gray-700">{entry.score}/10</span>
                </div>
                {entry.label && (
                  <p className="text-xs text-gray-500 mt-0.5">{entry.label}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
