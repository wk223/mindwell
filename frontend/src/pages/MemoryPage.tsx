import { useEffect, useState } from "react";
import { getMemories, deleteMemory, clearMemories, type Memory } from "../api/memories";
import { cn } from "../utils/cn";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  work: { label: "工作", color: "bg-sky-50 text-sky-600" },
  relationship: { label: "关系", color: "bg-blush-50 text-blush-600" },
  emotion: { label: "情绪", color: "bg-amber-50 text-amber-600" },
  health: { label: "健康", color: "bg-mint-50 text-mint-600" },
  goal: { label: "目标", color: "bg-lavender-50 text-lavender-600" },
  preference: { label: "偏好", color: "bg-cyan-50 text-cyan-600" },
  experience: { label: "经历", color: "bg-indigo-50 text-indigo-600" },
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMemories({ category, search: search || undefined });
      setMemories(data.memories);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setTotal((t) => t - 1);
  };

  const handleClearAll = async () => {
    if (!confirm("确定要删除所有记忆吗？")) return;
    await clearMemories();
    setMemories([]);
    setTotal(0);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };
  const stars = (level: number) => "★".repeat(level) + "☆".repeat(Math.max(0, 5 - level));

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">记忆</h1>
            <p className="text-sm text-gray-500 mt-1">AI 在对话中自动记录关于你的关键信息</p>
          </div>
          {total > 0 && (
            <button onClick={handleClearAll} className="text-sm text-blush-400 hover:text-blush-600 transition-colors">
              清空全部
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索记忆..."
              className="flex-1 px-4 py-2.5 bg-cream-100 border border-cream-200 rounded-2xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-mint-300 transition-all placeholder:text-gray-400" />
            <button type="submit" className="px-5 py-2.5 bg-cream-200 text-gray-600 rounded-2xl text-sm hover:bg-cream-300 transition-colors">
              搜索
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setCategory(undefined)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", !category ? "bg-mint-500 text-white" : "bg-cream-200 text-gray-600 hover:bg-cream-300")}>
            全部
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => (
            <button key={key} onClick={() => setCategory(key)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", category === key ? color : "bg-cream-200 text-gray-600 hover:bg-cream-300")}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-mint-300 border-t-transparent rounded-full mx-auto mb-3" />加载中...
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-3xl bg-cream-200 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-1">暂无记忆</h3>
            <p className="text-sm text-gray-400">继续和 AI 对话，系统会自动记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((m) => (
              <div key={m.id} className="glass-card p-4 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-medium text-gray-800 text-sm">{m.key}</h3>
                      {m.category && CATEGORY_LABELS[m.category] && (
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", CATEGORY_LABELS[m.category].color)}>
                          {CATEGORY_LABELS[m.category].label}
                        </span>
                      )}
                      <span className="text-xs text-amber-400">{stars(m.importance)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{m.content}</p>
                    {m.source_quote && <p className="text-xs text-gray-400 mt-1.5 italic">来源: "{m.source_quote}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleDateString("zh-CN")}</p>
                  </div>
                  <button onClick={() => handleDelete(m.id)}
                    className="shrink-0 p-1 rounded text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
