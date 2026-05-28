import { useState, useCallback } from "react";
import { useAssessmentStore } from "../../stores/useAssessmentStore";
import { cn } from "../../utils/cn";
import type { Question, ScaleOption } from "../../types/assessment";

export default function ScaleQuestion() {
  const currentScale = useAssessmentStore((s) => s.currentScale);
  const currentAnswers = useAssessmentStore((s) => s.currentAnswers);
  const setAnswer = useAssessmentStore((s) => s.setAnswer);
  const submit = useAssessmentStore((s) => s.submit);
  const isSubmitting = useAssessmentStore((s) => s.isSubmitting);
  const resetCurrent = useAssessmentStore((s) => s.resetCurrent);
  const selectedType = useAssessmentStore((s) => s.selectedType);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");

  if (!currentScale) return null;

  const questions = currentScale.questions;
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  const isFirst = currentIndex === 0;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(currentAnswers).length;
  const allAnswered = questions.every((q) => currentAnswers[q.id] !== undefined);
  const isPersonality = currentScale.id === "PERSONALITY_16";
  const progress = Math.round((answeredCount / total) * 100);

  const goTo = useCallback((idx: number, dir: "fwd" | "back") => {
    if (idx < 0 || idx >= total) return;
    setDirection(dir);
    setCurrentIndex(idx);
  }, [total]);

  const handleSelect = (qId: number, val: number) => {
    setAnswer(qId, val);
    if (!isLast) {
      setTimeout(() => goTo(currentIndex + 1, "fwd"), 280);
    }
  };

  const fillAll = () => {
    const maxVal = Math.max(...currentScale.options.map((o) => o.value));
    questions.forEach((q) => setAnswer(q.id, maxVal));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{currentScale.name}</h2>
          <p className="text-sm text-gray-500">
            {isPersonality && selectedType ? `${selectedType} · ` : ""}{currentScale.timeframe}
          </p>
        </div>
        <button onClick={resetCurrent} className="text-sm text-gray-500 hover:text-gray-700">返回列表</button>
      </div>

      {/* Progress bar */}
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>第 {currentIndex + 1} / {total} 题</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-cream-200 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-mint-400 to-mint-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div key={currentQ.id} className={cn(
        "glass-card p-6 mb-4",
        direction === "fwd" ? "animate-slide-in-right" : "animate-slide-in-left"
      )}>
        <p className="text-sm font-semibold text-gray-700 mb-5">
          {currentIndex + 1}. {currentQ.text}
        </p>
        <div className={cn(
          "grid gap-3",
          currentScale.options.length <= 3 ? "grid-cols-3" : currentScale.options.length === 4 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {currentScale.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(currentQ.id, opt.value)}
              className={cn(
                "py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 border-2",
                currentAnswers[currentQ.id] === opt.value
                  ? "border-mint-400 bg-mint-50 text-mint-700 shadow-sm"
                  : "border-cream-200 bg-white text-gray-500 hover:border-cream-300 hover:bg-cream-50"
              )}
            >
              <span className="text-xs text-gray-400 mr-2">{opt.value}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => goTo(currentIndex - 1, "back")}
          disabled={isFirst}
          className="px-4 py-2 rounded-2xl text-sm font-medium border border-cream-200 bg-white
                     text-gray-600 hover:bg-cream-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        >
          ← 上一题
        </button>

        <span className="text-xs text-gray-400">
          已答 {answeredCount}/{total}
        </span>

        {isLast ? (
          <button
            onClick={() => submit(currentScale.id, selectedType ?? undefined)}
            disabled={!allAnswered || isSubmitting}
            className="px-6 py-2 rounded-2xl bg-mint-500 text-white font-medium text-sm
                       hover:bg-mint-600 active:bg-mint-700 disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all shadow-soft"
          >
            {isSubmitting ? "提交中..." : "提交测评"}
          </button>
        ) : (
          <button
            onClick={() => goTo(currentIndex + 1, "fwd")}
            className="px-4 py-2 rounded-2xl text-sm font-medium border border-cream-200 bg-white
                       text-gray-600 hover:bg-cream-50 transition-all"
          >
            下一题 →
          </button>
        )}
      </div>

      {/* Quick fill */}
      {answeredCount < total && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={fillAll}
            className="text-xs text-gray-400 hover:text-mint-500 underline underline-offset-2 transition-colors"
          >
            一键填充(测试用)
          </button>
        </div>
      )}
    </div>
  );
}
