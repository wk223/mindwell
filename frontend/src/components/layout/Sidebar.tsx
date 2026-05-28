import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useDialogueStore } from "../../stores/useDialogueStore";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

interface SidebarProps {
  userNickname: string;
  onLogout: () => void;
}

const navItems = [
  { to: "/chat", label: "倾诉", icon: ChatIcon },
  { to: "/echo", label: "ECHO · 答案之书", icon: EchoIcon },
  { to: "/mood", label: "情绪日记", icon: MoodIcon },
];

const stagger = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
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

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="w-[240px] shrink-0 flex flex-col h-full relative overflow-hidden"
    >
      {/* Deep space gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-900/95 via-void-850/90 to-void-800/85" />

      {/* Subtle starlight dots (CSS-only) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 10%, rgba(255,255,255,0.6), transparent), " +
            "radial-gradient(1px 1px at 65% 25%, rgba(255,255,255,0.4), transparent), " +
            "radial-gradient(1.5px 1.5px at 40% 55%, rgba(255,255,255,0.5), transparent), " +
            "radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.3), transparent), " +
            "radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.4), transparent), " +
            "radial-gradient(1.5px 1.5px at 55% 80%, rgba(255,255,255,0.35), transparent)",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Floating light orb */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(200,180,220,1) 0%, transparent 70%)",
        }}
      />

      {/* Glass border overlay */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo area */}
        <div className="px-6 pt-7 pb-5">
          <h1 className="font-serif text-xl font-semibold tracking-tight text-slate-100">
            观心
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 tracking-wider">
            MINDWELL
          </p>
        </div>

        {/* New chat button */}
        <div className="px-4 pb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewChat}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-white/[0.05] border border-white/[0.06] text-slate-300
                       hover:bg-white/[0.08] hover:border-white/[0.1] hover:text-slate-100
                       transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            新对话
          </motion.button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <AnimatePresence>
            {conversations.length > 0 && (
              <motion.div className="space-y-0.5" variants={stagger} initial="initial" animate="animate">
                {conversations.slice(0, 20).map((conv) => (
                  <motion.div key={conv.id} variants={itemAnim} className="group relative">
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 truncate block",
                        activeId === conv.id
                          ? "bg-white/[0.08] text-slate-100 font-medium"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      )}
                    >
                      {conv.title || "新对话"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md
                                 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100
                                 transition-all duration-200"
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

          {conversations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-600 leading-relaxed">
                还没有对话
                <br />
                开始你的第一次倾诉
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-4 py-3 space-y-1 border-t border-white/[0.04]">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-white/[0.08] text-slate-100"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  )
                }
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-slate-300 font-medium text-sm border border-white/[0.06]">
              {userNickname[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">{userNickname}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              className="text-slate-600 hover:text-slate-400 transition-colors duration-200"
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

/* ── Icons ── */

function ChatIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function EchoIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.76A7.08 7.08 0 0112 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8l2 4-2 2-2-2 2-4z" />
    </svg>
  );
}

function MoodIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
