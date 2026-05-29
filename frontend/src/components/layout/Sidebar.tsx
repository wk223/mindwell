import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useDialogueStore } from "../../stores/useDialogueStore";
import MoonIcon from "../shared/MoonIcon";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

interface SidebarProps {
  userNickname: string;
  onLogout: () => void;
}

const navItems = [
  { to: "/home", label: "首页" },
  { to: "/chat", label: "倾诉" },
  { to: "/echo", label: "答案之书" },
  { to: "/mood", label: "情绪日记" },
  { to: "/assessment", label: "自我了解" },
  { to: "/night", label: "深夜陪伴" },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const itemAnim = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

export default function Sidebar({ userNickname, onLogout }: SidebarProps) {
  const conversations = useDialogueStore((s) => s.conversations);
  const activeId = useDialogueStore((s) => s.activeConversationId);
  const loadConversations = useDialogueStore((s) => s.loadConversations);
  const selectConversation = useDialogueStore((s) => s.selectConversation);
  const createNewChat = useDialogueStore((s) => s.createNewChat);
  const deleteConversation = useDialogueStore((s) => s.deleteConversation);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="w-[240px] shrink-0 flex flex-col h-full relative overflow-hidden"
    >
      {/* 背景 — 使用 CSS 变量跟随日夜切换 */}
      <div
        className="absolute inset-0 transition-[background] duration-[1.8s]"
        style={{
          background: "linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-mid) 100%)",
        }}
      />

      {/* 星光 dots (CSS-only) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        {[
          { top: "8%", left: "20%" }, { top: "22%", left: "65%" },
          { top: "40%", left: "40%" }, { top: "55%", left: "78%" },
          { top: "68%", left: "15%" }, { top: "78%", left: "55%" },
        ].map((pos, i) => (
          <div
            key={i}
            className="star-dot"
            style={{
              top: pos.top,
              left: pos.left,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* 浮动光球 */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, var(--accent-400) 0%, transparent 70%)",
        }}
      />

      {/* 玻璃分割线 */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo — CSS 月亮 + 品牌名 */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <MoonIcon size={28} glowing />
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                观心
              </h1>
              <p className="text-[10px] tracking-widest" style={{ color: "var(--text-tertiary)" }}>
                MINDWELL
              </p>
            </div>
          </div>
        </div>

        {/* 新对话按钮 */}
        <div className="px-4 pb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewChat}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                       transition-all duration-300 nav-item-hover"
            style={{
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-light)",
              color: "var(--text-secondary)",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            新对话
          </motion.button>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <AnimatePresence>
            {conversations.length > 0 && (
              <motion.div className="space-y-0.5" variants={stagger} initial="initial" animate="animate">
                {conversations.slice(0, 20).map((conv) => (
                  <motion.div key={conv.id} variants={itemAnim} className="group relative">
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 truncate block nav-item-hover"
                      style={
                        activeId === conv.id
                          ? {
                              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-400) 10%, transparent) 0%, color-mix(in srgb, var(--accent-300) 6%, transparent) 100%)",
                              border: "1px solid color-mix(in srgb, var(--accent-400) 22%, transparent)",
                              color: "var(--text-primary)",
                              boxShadow: "inset 0 0 20px -8px color-mix(in srgb, var(--accent-400) 12%, transparent), 0 0 16px -6px color-mix(in srgb, var(--accent-400) 14%, transparent)",
                            }
                          : { color: "var(--text-secondary)", background: "transparent", border: "1px solid transparent" }
                      }
                    >
                      {conv.title || "新对话"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                                 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {loading && conversations.length === 0 && (
            <div className="px-3 space-y-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg animate-pulse"
                  style={{
                    width: `${60 + i * 10}%`,
                    background: "var(--bg-glass)",
                  }}
                />
              ))}
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <div className="text-center py-10 empty-atmosphere">
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                还没有对话
                <br />
                开始你的第一次倾诉
              </p>
            </div>
          )}
        </div>

        {/* 导航 — 情绪入口 */}
        <nav
          className="px-4 py-3 space-y-1 border-t"
          style={{ borderColor: "var(--border-light)" }}
        >
          {navItems.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: easeOut }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 nav-item-hover",
                    isActive ? "nav-item-active" : ""
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? { color: "var(--text-primary)" }
                    : { color: "var(--text-secondary)", background: "transparent" }
                }
              >
                {/* CSS dot indicator */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                  style={{
                    background: "var(--accent-400)",
                    opacity: 0.5,
                  }}
                />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User area */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--border-light)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border"
              style={{
                background: "var(--bg-glass)",
                borderColor: "var(--card-border)",
                color: "var(--text-primary)",
              }}
            >
              {userNickname[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {userNickname}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              className="transition-colors duration-200"
              style={{ color: "var(--text-tertiary)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
