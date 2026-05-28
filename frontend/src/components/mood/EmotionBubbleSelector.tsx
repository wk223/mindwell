import { cn } from "../../utils/cn";

const EMOTION_GROUPS = [
  { scores: [1, 2], emoji: "😭", label: "非常低落", color: "hover:bg-rose-50 border-rose-200", activeColor: "bg-rose-50 border-rose-300 ring-rose-200" },
  { scores: [3, 4], emoji: "😔", label: "不太好", color: "hover:bg-amber-50 border-amber-200", activeColor: "bg-amber-50 border-amber-300 ring-amber-200" },
  { scores: [5, 6], emoji: "😐", label: "一般", color: "hover:bg-gray-50 border-gray-200", activeColor: "bg-gray-50 border-gray-300 ring-gray-200" },
  { scores: [7, 8], emoji: "😊", label: "不错", color: "hover:bg-mint-50 border-mint-200", activeColor: "bg-mint-50 border-mint-300 ring-mint-200" },
  { scores: [9, 10], emoji: "🌟", label: "非常好", color: "hover:bg-mint-50 border-mint-200", activeColor: "bg-mint-50 border-mint-300 ring-mint-200" },
];

interface Props {
  score: number | null;
  onSelect: (score: number) => void;
  readonly?: boolean;
}

export default function EmotionBubbleSelector({ score, onSelect, readonly }: Props) {
  const getGroupForScore = (s: number) => EMOTION_GROUPS.find(g => g.scores.includes(s));

  const handleClick = (groupScores: number[]) => {
    if (readonly) return;
    // Toggle: if the selected score is in this group, pick the other score in the pair
    if (score !== null && groupScores.includes(score)) {
      const other = groupScores[0] === score ? groupScores[1] : groupScores[0];
      onSelect(other);
    } else {
      // Pick the higher score in the group by default
      onSelect(groupScores[groupScores.length - 1]);
    }
  };

  const activeGroup = score ? getGroupForScore(score) : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 sm:gap-5">
        {EMOTION_GROUPS.map((group) => {
          const isActive = score !== null && group.scores.includes(score);
          return (
            <button
              key={group.emoji}
              onClick={() => handleClick(group.scores)}
              disabled={readonly}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-3xl border-2 transition-all duration-300",
                isActive
                  ? `scale-110 ring-2 ${group.activeColor}`
                  : `border-transparent ${group.color} hover:scale-105`,
                readonly && "cursor-default"
              )}
            >
              <span className={cn(
                "text-3xl sm:text-4xl transition-transform duration-300",
                isActive && "scale-110"
              )}>
                {group.emoji}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
            </button>
          );
        })}
      </div>
      {score && activeGroup && (
        <p className="text-sm text-gray-500 animate-slide-in-right">
          今天感觉<strong className="text-gray-700">{activeGroup.label}</strong>
        </p>
      )}
    </div>
  );
}
