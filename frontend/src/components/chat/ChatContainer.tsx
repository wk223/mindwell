import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDialogueStore } from "../../stores/useDialogueStore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import CrisisBanner from "./CrisisBanner";
import ChatInput from "./ChatInput";

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

export default function ChatContainer() {
  const messages = useDialogueStore((s) => s.messages);
  const isStreaming = useDialogueStore((s) => s.isStreaming);
  const streamingContent = useDialogueStore((s) => s.streamingContent);
  const crisisActive = useDialogueStore((s) => s.crisisActive);
  const crisisResponse = useDialogueStore((s) => s.crisisResponse);
  const safetyFlags = useDialogueStore((s) => s.safetyFlags);
  const error = useDialogueStore((s) => s.error);
  const sendMessage = useDialogueStore((s) => s.sendMessage);
  const clearError = useDialogueStore((s) => s.clearError);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="max-w-3xl mx-auto">
          {/* Empty state — welcome */}
          {messages.length === 0 && !crisisActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="text-center py-20"
            >
              {/* Breathing AI avatar */}
              <div className="relative mx-auto mb-8 w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-lavender-400/10 animate-breathe" />
                <div
                  className="absolute inset-2 rounded-full bg-lavender-400/5 animate-breathe-slow"
                  style={{ animationDelay: "-3s" }}
                />
                <div className="relative w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-2xl"
                  >
                    🌙
                  </motion.span>
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-serif text-2xl font-medium text-slate-200 mb-3 tracking-tight"
              >
                我在认真听
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-slate-500 max-w-sm mx-auto leading-relaxed text-sm"
              >
                你不用组织语言，想到什么都可以说。
              </motion.p>
            </motion.div>
          )}

          {/* Crisis banner */}
          <CrisisBanner
            visible={crisisActive}
            message={crisisResponse}
            flags={safetyFlags as Array<{ rule_id: string; severity: string }>}
          />

          {/* Safety flags indicator */}
          <AnimatePresence>
            {safetyFlags.length > 0 && !crisisActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-moon-400/10 border border-moon-400/15 rounded-2xl px-4 py-3 mb-4 text-sm text-moon-200"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                已标记安全关注点 — AI 回复已加入安全引导
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message list */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </motion.div>

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-5"
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-lavender-300 text-xs font-medium shrink-0">
                M
              </div>
              <div
                className="bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[72%]"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                <p className="text-sm whitespace-pre-wrap break-words text-slate-300">
                  {streamingContent}
                </p>
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingContent && <TypingIndicator />}

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-rose-500/10 border border-rose-400/15 rounded-2xl px-4 py-3 mb-4 text-sm text-rose-200 flex items-center justify-between"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-rose-300 hover:text-rose-100 ml-2 font-medium transition-colors"
                >
                  关闭
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
