import { useAssessmentStore } from "../../stores/useAssessmentStore";
import { TYPE_GROUPS } from "../../types/assessment";
import { cn } from "../../utils/cn";

const groupColors: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-lavender-50", border: "border-lavender-300", text: "text-lavender-600" },
  green: { bg: "bg-mint-50", border: "border-mint-300", text: "text-mint-600" },
  blue: { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-600" },
  yellow: { bg: "bg-blush-50", border: "border-blush-300", text: "text-blush-600" },
};

export default function TypeSelector() {
  const selectedType = useAssessmentStore((s) => s.selectedType);
  const selectType = useAssessmentStore((s) => s.selectType);
  const loadScaleDetail = useAssessmentStore((s) => s.loadScaleDetail);
  const resetCurrent = useAssessmentStore((s) => s.resetCurrent);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">选择你的人格类型</h2>
          <p className="text-sm text-gray-500 mt-1">请选择最符合你的人格类型</p>
        </div>
        <button onClick={resetCurrent} className="text-sm text-gray-500 hover:text-gray-700">返回列表</button>
      </div>

      <div className="space-y-6">
        {TYPE_GROUPS.map((group) => {
          const colors = groupColors[group.color];
          return (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{group.label}</h3>
              <div className="grid grid-cols-2 gap-3">
                {group.types.map((type) => (
                  <button key={type} onClick={() => selectType(type)}
                    className={cn("p-4 rounded-2xl border text-left transition-all",
                      selectedType === type ? `${colors.border} ${colors.bg}` : "border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50")}>
                    <span className={cn("text-2xl font-bold", selectedType === type ? colors.text : "text-gray-800")}>{type}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <button onClick={() => selectedType && loadScaleDetail("PERSONALITY_16", selectedType)}
          disabled={!selectedType}
          className="w-full py-3 rounded-2xl bg-mint-500 text-white font-medium text-sm
                     hover:bg-mint-600 active:bg-mint-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-soft">
          {selectedType ? `开始 ${selectedType} 测评` : "请先选择你的人格类型"}
        </button>
      </div>
    </div>
  );
}
