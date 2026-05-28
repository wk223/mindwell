import type { Post } from "../../types/community";

interface PostCardProps { post: Post; onClick: (id: string) => void; }

export default function PostCard({ post, onClick }: PostCardProps) {
  return (
    <button onClick={() => onClick(post.id)}
      className="w-full text-left glass-card p-5 hover:shadow-card transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{post.title}</h3>
        {post.content_labels.length > 0 && (
          <span className="shrink-0 ml-2 px-2 py-0.5 bg-blush-50 text-blush-600 text-xs rounded-full font-medium">含敏感内容</span>
        )}
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{post.display_name}</span>
        <span>{formatTimeAgo(post.created_at)}</span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comment_count}
        </span>
      </div>
    </button>
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
