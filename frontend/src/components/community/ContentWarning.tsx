const LABEL_DESCRIPTIONS: Record<string, string> = {
  "trigger:suicide": "包含自杀相关内容",
  "trigger:self_harm": "包含自伤相关内容",
  "trigger:sexual_assault": "包含性侵犯相关内容",
  "trigger:abuse": "包含虐待相关内容",
  "trigger:domestic_violence": "包含家庭暴力相关内容",
  "trigger:trauma": "包含创伤经历相关内容",
};

export default function ContentWarning({ labels, onProceed, onBack }: {
  labels: string[]; onProceed: () => void; onBack: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-blush-50 to-cream-50 border-2 border-blush-200 rounded-3xl p-8 text-center max-w-md mx-auto">
      <span className="text-4xl mb-4 block">⚠️</span>
      <h2 className="text-lg font-semibold text-blush-700 mb-2">内容提示</h2>
      <p className="text-sm text-blush-600 mb-4">此内容可能涉及敏感话题：</p>
      <ul className="text-sm text-blush-600 mb-6 space-y-1">
        {labels.map((l) => <li key={l}>{LABEL_DESCRIPTIONS[l] || l}</li>)}
      </ul>
      <p className="text-sm text-gray-500 mb-6">请确认你处于可以阅读此类内容的心理状态</p>
      <div className="flex gap-3 justify-center">
        <button onClick={onBack} className="px-5 py-2 rounded-2xl bg-white border border-cream-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">返回</button>
        <button onClick={onProceed} className="px-5 py-2 rounded-2xl bg-blush-400 text-white hover:bg-blush-500 transition-colors text-sm font-medium">我确认继续阅读</button>
      </div>
    </div>
  );
}
