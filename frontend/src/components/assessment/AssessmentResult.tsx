import { useAssessmentStore } from "../../stores/useAssessmentStore";
import { cn } from "../../utils/cn";
import { SEVERITY_COLORS, STAGE_LABELS, TYPE_GROUPS } from "../../types/assessment";
import type { PersonalityResultData, DimensionScore } from "../../types/assessment";

const STAGE_EMOJI: Record<string, string> = {
  unawakened: "🌱", low: "🌿", medium: "🌳", high: "✨",
};

const STAGE_GRADIENT: Record<string, string> = {
  unawakened: "from-gray-100 to-gray-50 border-gray-200",
  low: "from-sky-50 to-blue-50 border-sky-200",
  medium: "from-mint-50 to-emerald-50 border-mint-200",
  high: "from-amber-50 to-yellow-50 border-amber-200",
  minimal: "from-mint-50 to-emerald-50 border-mint-200",
  mild: "from-yellow-50 to-amber-50 border-yellow-200",
  moderate: "from-orange-50 to-amber-50 border-orange-200",
  moderately_severe: "from-red-50 to-rose-50 border-red-200",
  severe: "from-red-100 to-rose-100 border-red-300",
};

const SEVERITY_ICON: Record<string, string> = {
  minimal: "💚", mild: "💛", moderate: "🧡", moderately_severe: "❤️", severe: "🆘",
  unawakened: "🌱", low: "🌿", medium: "🌳", high: "✨",
};

const DIM_GRADIENTS = [
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-mint-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-teal-500",
  "from-indigo-400 to-blue-500",
  "from-lime-400 to-green-500",
];

export default function AssessmentResultView() {
  const currentResult = useAssessmentStore((s) => s.currentResult);
  const currentScale = useAssessmentStore((s) => s.currentScale);
  const resetCurrent = useAssessmentStore((s) => s.resetCurrent);
  if (!currentResult) return null;

  const isPersonality = currentResult.scale_type === "PERSONALITY_16";
  const resultData = currentResult.answers as PersonalityResultData | null;
  const hasPersonalityData = isPersonality && resultData?.type_code;
  const severity = currentResult.severity;
  const gradient = STAGE_GRADIENT[severity] || "from-mint-50 to-cream-50 border-mint-200";
  const icon = SEVERITY_ICON[severity] || "💚";
  const percentage = Math.round((currentResult.total_score / currentResult.max_score) * 100);

  // Find type group color
  const typeGroup = hasPersonalityData
    ? TYPE_GROUPS.find((g) => g.types.includes(resultData!.type_code))
    : null;
  const groupColor = typeGroup?.color || "green";

  // Parse interpretation sections
  const sections = parseInterpretation(currentResult.interpretation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">测评结果</h2>
        <button onClick={resetCurrent} className="text-sm text-gray-500 hover:text-gray-700">重新测评</button>
      </div>

      {/* Score Card */}
      <div className={cn(
        "relative overflow-hidden rounded-4xl border p-8 text-center bg-gradient-to-br shadow-card",
        gradient
      )}>
        {/* Background icon */}
        <div className="absolute -top-4 -right-4 text-7xl opacity-20">{icon}</div>
        <div className="absolute -bottom-6 -left-6 text-8xl opacity-10">{icon}</div>

        <div className="relative z-10">
          {hasPersonalityData ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur text-xs font-medium text-gray-600 mb-4">
                <span className={cn("w-2 h-2 rounded-full", groupColor === "purple" ? "bg-purple-400" : groupColor === "green" ? "bg-emerald-400" : groupColor === "blue" ? "bg-sky-400" : "bg-amber-400")} />
                {resultData!.type_code} · {resultData!.type_name}
              </div>
              <div className="text-6xl mb-3">{icon}</div>
              <div className="text-4xl font-bold text-gray-800 mb-1">
                {currentResult.total_score}<span className="text-base text-gray-400 font-normal"> / {currentResult.max_score}</span>
              </div>
              <span className={cn("inline-block px-4 py-1.5 rounded-full text-sm font-semibold border", SEVERITY_COLORS[severity] || SEVERITY_COLORS.minimal)}>
                {isPersonality ? STAGE_LABELS[severity] || severity : currentResult.severity_level}
              </span>
              {resultData?.stage_quote && (
                <p className="mt-4 text-sm text-gray-500 italic leading-relaxed max-w-md mx-auto">「{resultData.stage_quote}」</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">{currentScale?.name || currentResult.scale_type}</p>
              <div className="text-6xl mb-3">{icon}</div>
              {/* Score circle */}
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-cream-200" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeLinecap="round" className="text-mint-400 transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{currentResult.total_score}</span>
                  <span className="text-xs text-gray-400">{percentage}%</span>
                </div>
              </div>
              <span className={cn("inline-block px-4 py-1.5 rounded-full text-sm font-semibold border", SEVERITY_COLORS[severity] || SEVERITY_COLORS.minimal)}>
                {currentResult.severity_level}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Dimension Scores (personality only) */}
      {hasPersonalityData && resultData!.dimension_scores && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <span>📊</span>维度得分
          </h3>
          <div className="space-y-4">
            {Object.entries(resultData!.dimension_scores)
              .sort(([, a], [, b]) => (b as DimensionScore).final - (a as DimensionScore).final)
              .map(([dim, scores], i) => {
                const s = scores as DimensionScore;
                const dimGradient = DIM_GRADIENTS[i % DIM_GRADIENTS.length];
                return (
                  <div key={dim}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-medium">{dim}</span>
                        <span className="text-[11px] text-gray-400">原始 {s.raw}/{s.max_raw}</span>
                      </div>
                      <span className="text-gray-700 font-mono font-semibold">{s.final.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={cn("h-3 rounded-full bg-gradient-to-r transition-all duration-700", dimGradient)}
                        style={{ width: `${Math.max(2, Math.min(100, s.final))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Interpretation */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>📖</span>详细解读
          </h3>
          {sections.map((sec, i) => (
            <div key={i} className={cn(
              "glass-card p-5 border-l-4",
              i === 0 ? "border-l-mint-400" : "border-l-cream-300"
            )}>
              {sec.title && (
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{sec.title}</h4>
              )}
              {sec.lines.map((line, j) => (
                <p key={j} className={cn(
                  "text-sm leading-relaxed",
                  line.startsWith("█") ? "text-xs text-gray-400 font-mono" : "text-gray-600",
                  j < sec.lines.length - 1 ? "mb-1.5" : ""
                )}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>📖</span>解读
          </h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{currentResult.interpretation}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gradient-to-r from-blush-50 to-cream-50 border border-blush-100 rounded-3xl p-5 text-sm text-blush-600">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="font-medium mb-1">重要提示</p>
            <p className="text-xs leading-relaxed">本测评结果仅供参考，不构成临床诊断。如有担忧请咨询专业心理医生。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Parse interpretation text into structured sections */
function parseInterpretation(text: string): { title: string; lines: string[] }[] {
  if (!text) return [];
  const rawLines = text.split("\n");
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) current.lines.push("");
      continue;
    }
    // Section headers like 【你的类型】 or 📌 阶段洞察
    const headerMatch = trimmed.match(/^[【📌📖🧠📊💡🗺️⚠️🔒]/);
    if (headerMatch && current && current.lines.length > 0) {
      sections.push(current);
      current = { title: trimmed, lines: [] };
    } else if (headerMatch && !current) {
      current = { title: trimmed, lines: [] };
    } else {
      if (!current) current = { title: "", lines: [] };
      current.lines.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}
