import { useEffect } from "react";
import { useAssessmentStore } from "../../stores/useAssessmentStore";
import { cn } from "../../utils/cn";

export default function AssessmentCard() {
  const scales = useAssessmentStore((s) => s.scales);
  const isLoading = useAssessmentStore((s) => s.isLoading);
  const loadScales = useAssessmentStore((s) => s.loadScales);
  const loadScaleDetail = useAssessmentStore((s) => s.loadScaleDetail);
  const startPersonalityTest = useAssessmentStore((s) => s.startPersonalityTest);
  const results = useAssessmentStore((s) => s.results);
  const loadHistory = useAssessmentStore((s) => s.loadHistory);
  const loadResult = useAssessmentStore((s) => s.loadResult);

  useEffect(() => {
    loadScales();
    loadHistory();
  }, [loadScales, loadHistory]);

  const hasCompleted = (scaleId: string) => results.some((r) => r.scale_type === scaleId);

  const handleScaleClick = (scaleId: string) => {
    if (scaleId === "PERSONALITY_16") startPersonalityTest();
    else loadScaleDetail(scaleId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-mint-300 border-t-transparent rounded-full mx-auto mb-3" />加载中...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">可用量表</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {scales.map((scale) => (
            <button key={scale.id} onClick={() => handleScaleClick(scale.id)}
              className="text-left glass-card p-5 hover:shadow-card transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-mint-600">{scale.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{scale.description}</p>
                </div>
                {hasCompleted(scale.id) && (
                  <span className="shrink-0 ml-2 px-2 py-0.5 bg-mint-50 text-mint-600 text-xs rounded-full font-medium">已完成</span>
                )}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>{scale.total_questions} 题</span>
                <span>评估周期: {scale.timeframe}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">测评历史</h2>
          <div className="space-y-2">
            {results.slice(0, 5).map((r) => (
              <button key={r.id} onClick={() => loadResult(r.id)}
                className="w-full text-left glass-card px-4 py-3 hover:bg-white transition-colors flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800">{r.scale_type}</span>
                  <span className="text-xs text-gray-500 ml-2">{new Date(r.completed_at).toLocaleDateString("zh-CN")}</span>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  r.severity === "minimal" && "bg-mint-50 text-mint-600",
                  r.severity === "mild" && "bg-yellow-50 text-yellow-600",
                  r.severity === "moderate" && "bg-orange-50 text-orange-600",
                  r.severity === "moderately_severe" && "bg-red-50 text-red-600",
                  r.severity === "severe" && "bg-red-100 text-red-700")}>
                  {r.total_score}分 · {r.severity_level}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
