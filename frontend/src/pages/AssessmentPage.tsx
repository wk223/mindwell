import { useAssessmentStore } from "../stores/useAssessmentStore";
import AssessmentCard from "../components/assessment/AssessmentCard";
import ScaleQuestion from "../components/assessment/ScaleQuestion";
import AssessmentResultView from "../components/assessment/AssessmentResult";
import TypeSelector from "../components/assessment/TypeSelector";

export default function AssessmentPage() {
  const currentScale = useAssessmentStore((s) => s.currentScale);
  const currentResult = useAssessmentStore((s) => s.currentResult);
  const showTypeSelector = useAssessmentStore((s) => s.showTypeSelector);
  const isLoading = useAssessmentStore((s) => s.isLoading);
  const error = useAssessmentStore((s) => s.error);
  const clearError = useAssessmentStore((s) => s.clearError);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">心理测评</h1>
          <p className="text-sm text-gray-500 mt-1">标准化心理健康量表，帮助你了解自己的情绪状态</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <button onClick={clearError} className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0">关闭</button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-mint-300 border-t-transparent rounded-full mx-auto mb-3" />
            加载中...
          </div>
        ) : currentResult ? (
          <AssessmentResultView />
        ) : currentScale ? (
          <ScaleQuestion />
        ) : showTypeSelector ? (
          <TypeSelector />
        ) : (
          <AssessmentCard />
        )}
      </div>
    </div>
  );
}
