import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../api/client";

interface StrangerPost {
  id: string;
  content: string;
  created_at: string;
}

export default function StrangerWall() {
  const [posts, setPosts] = useState<StrangerPost[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await apiRequest<{ posts: StrangerPost[] }>("/community/posts?limit=6");
      setPosts(data.posts || []);
    } catch { /* 静默失败 */ }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePost = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      await apiRequest("/community/posts", {
        method: "POST",
        body: JSON.stringify({
          display_name: "陌生人",
          title: input.slice(0, 30),
          content: input,
          is_anonymous: true,
        }),
      });
      setInput("");
      loadPosts();
    } catch { /* 静默 */ }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-secondary mt-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-medium" style={{ color: "var(--text-primary)" }}>
          陌生人的信
        </h3>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          匿名 · 所有人可见
        </span>
      </div>

      {/* 输入区 */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
          placeholder="写一句话，扔进风里..."
          maxLength={200}
          className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none"
          style={{
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePost}
          disabled={!input.trim() || loading}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30"
          style={{
            background: "var(--accent-400)",
            color: "#fff",
          }}
        >
          {loading ? "..." : "扔出去"}
        </motion.button>
      </div>

      {/* 帖子列表 */}
      <AnimatePresence>
        {posts.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>
            还没有人说话。做第一个。
          </p>
        ) : (
          <div className="space-y-2.5">
            {posts.slice(0, 5).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--bg-glass)",
                  border: "0.5px solid var(--border-light)",
                  color: "var(--text-secondary)",
                }}
              >
                <p className="leading-relaxed">{post.content}</p>
                <p className="text-[10px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                  陌生人 · {new Date(post.created_at).toLocaleDateString("zh-CN")}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
