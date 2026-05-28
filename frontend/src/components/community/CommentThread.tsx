import { useState } from "react";
import { useCommunityStore } from "../../stores/useCommunityStore";
import type { Comment } from "../../types/community";

export default function CommentThread({ postId, comments }: { postId: string; comments: Comment[] }) {
  const [displayName, setDisplayName] = useState("");
  const [content, setContent] = useState("");
  const addComment = useCommunityStore((s) => s.addComment);
  const isSubmitting = useCommunityStore((s) => s.isSubmitting);
  const error = useCommunityStore((s) => s.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !content.trim()) return;
    await addComment(postId, displayName.trim(), content.trim(), true);
    setDisplayName("");
    setContent("");
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-gray-800">评论 ({comments.length})</h3>
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-cream-100/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">{c.display_name}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-6 text-center">暂无评论，来留下第一个温暖回应吧</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 space-y-2">
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你的化名" maxLength={50} required
            className="w-full px-3 py-2 bg-cream-100 border border-cream-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-mint-300 placeholder:text-gray-400" />
          <input type="text" value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的回应..." maxLength={2000} required
            className="w-full px-3 py-2 bg-cream-100 border border-cream-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-mint-300 placeholder:text-gray-400" />
        </div>
        <button type="submit" disabled={isSubmitting || !displayName.trim() || !content.trim()}
          className="shrink-0 self-end px-4 py-2 rounded-2xl bg-mint-500 text-white hover:bg-mint-600
                     disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-soft">回复</button>
      </form>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}
