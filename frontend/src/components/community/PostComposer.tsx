import { useState } from "react";
import { useCommunityStore } from "../../stores/useCommunityStore";

const TRIGGER_LABELS = [
  { value: "trigger:suicide", label: "自杀" },
  { value: "trigger:self_harm", label: "自伤" },
  { value: "trigger:sexual_assault", label: "性侵犯" },
  { value: "trigger:abuse", label: "虐待" },
  { value: "trigger:domestic_violence", label: "家暴" },
  { value: "trigger:trauma", label: "创伤" },
];

export default function PostComposer({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const createPost = useCommunityStore((s) => s.createPost);
  const isSubmitting = useCommunityStore((s) => s.isSubmitting);
  const error = useCommunityStore((s) => s.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !title.trim() || !content.trim()) return;
    await createPost(displayName.trim(), title.trim(), content.trim(), selectedLabels, true);
    onClose();
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-5">发布帖子</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">你的化名</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="匿名发布时的显示名称" maxLength={50} required
            className="w-full px-4 py-2.5 bg-cream-100 border border-cream-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-mint-300 text-sm placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="给帖子起个标题" maxLength={200} required
            className="w-full px-4 py-2.5 bg-cream-100 border border-cream-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-mint-300 text-sm placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的故事、感受或想法..." rows={5} maxLength={5000} required
            className="w-full px-4 py-2.5 bg-cream-100 border border-cream-300 rounded-xl resize-none
                       focus:outline-none focus:ring-2 focus:ring-mint-300 text-sm placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">内容标签</label>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_LABELS.map((l) => (
              <button key={l.value} type="button" onClick={() => toggleLabel(l.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedLabels.includes(l.value)
                    ? "bg-blush-50 text-blush-600 border border-blush-200"
                    : "bg-cream-100 text-gray-500 border border-cream-200 hover:bg-cream-200"
                }`}>{l.label}</button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-cream-200 text-gray-600 hover:bg-cream-300 text-sm font-medium transition-colors">取消</button>
          <button type="submit" disabled={isSubmitting || !displayName.trim() || !title.trim() || !content.trim()}
            className="px-4 py-2 rounded-2xl bg-mint-500 text-white hover:bg-mint-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-soft">
            {isSubmitting ? "发布中..." : "匿名发布"}
          </button>
        </div>
      </div>
    </form>
  );
}
