import { useEffect, useState } from "react";
import { useCommunityStore } from "../stores/useCommunityStore";
import PostCard from "../components/community/PostCard";
import PostComposer from "../components/community/PostComposer";
import CommentThread from "../components/community/CommentThread";
import ContentWarning from "../components/community/ContentWarning";

export default function CommunityPage() {
  const posts = useCommunityStore((s) => s.posts);
  const currentPost = useCommunityStore((s) => s.currentPost);
  const total = useCommunityStore((s) => s.total);
  const isLoading = useCommunityStore((s) => s.isLoading);
  const error = useCommunityStore((s) => s.error);
  const loadPosts = useCommunityStore((s) => s.loadPosts);
  const loadPost = useCommunityStore((s) => s.loadPost);
  const deletePost = useCommunityStore((s) => s.deletePost);
  const reportPost = useCommunityStore((s) => s.reportPost);
  const clearError = useCommunityStore((s) => s.clearError);

  const [showComposer, setShowComposer] = useState(false);
  const [contentWarningAccepted, setContentWarningAccepted] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostClick = (postId: string) => {
    loadPost(postId);
    setContentWarningAccepted(false);
  };

  const handleBack = () => {
    useCommunityStore.setState({ currentPost: null });
  };

  if (currentPost) {
    const hasTriggers = currentPost.content_labels && currentPost.content_labels.length > 0;
    if (hasTriggers && !contentWarningAccepted) {
      return (
        <div className="h-full overflow-y-auto">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <ContentWarning labels={currentPost.content_labels} onProceed={() => setContentWarningAccepted(true)} onBack={handleBack} />
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <button onClick={handleBack} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回帖子列表
          </button>
          <div className="glass-card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{currentPost.title}</h1>
                <p className="text-sm text-gray-500 mt-1">{currentPost.display_name} · {new Date(currentPost.created_at).toLocaleDateString("zh-CN")}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => reportPost(currentPost.id)} className="text-xs text-gray-400 hover:text-blush-500 transition-colors">举报</button>
                <button onClick={() => { deletePost(currentPost.id); handleBack(); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">删除</button>
              </div>
            </div>
            {currentPost.content_labels.length > 0 && (
              <div className="flex gap-2 mb-4">
                {currentPost.content_labels.map((l) => (
                  <span key={l} className="px-2 py-0.5 bg-blush-50 text-blush-600 text-xs rounded-full">触发提示: {l.replace("trigger:", "")}</span>
                ))}
              </div>
            )}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentPost.content}</p>
          </div>
          <CommentThread postId={currentPost.id} comments={currentPost.comments || []} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">匿名社区</h1>
            <p className="text-sm text-gray-500 mt-1">安全、匿名的空间，分享与倾听</p>
          </div>
          <button onClick={() => setShowComposer(!showComposer)} className="btn-heal text-sm">
            {showComposer ? "取消" : "发布帖子"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2.5 mb-4 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700 ml-2 font-medium">关闭</button>
          </div>
        )}

        {showComposer && (
          <div className="mb-6">
            <PostComposer onClose={() => setShowComposer(false)} />
          </div>
        )}

        <div className="glass-card p-5 mb-6 text-sm text-gray-600">
          <p className="font-medium mb-1">社区守则</p>
          <ul className="space-y-0.5 text-gray-500">
            <li>- 尊重他人，友善交流</li>
            <li>- 如实标注敏感内容，保护其他成员</li>
            <li>- 不发布诊断建议或药物推荐</li>
            <li>- 危机情况请联系专业热线而非发帖</li>
          </ul>
        </div>

        {isLoading && posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-mint-300 border-t-transparent rounded-full mx-auto mb-3" />
            加载中...
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={handlePostClick} />
            ))}
            {posts.length < total && (
              <button onClick={() => loadPosts(Math.floor(posts.length / 20) + 2)} className="w-full py-3 text-sm text-mint-600 hover:text-mint-700 font-medium">
                加载更多
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p>暂无帖子</p>
            <p className="text-sm mt-1">成为第一个分享的人</p>
          </div>
        )}
      </div>
    </div>
  );
}
