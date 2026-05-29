import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDialogueStore } from "../../stores/useDialogueStore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import CrisisBanner from "./CrisisBanner";
import ChatInput from "./ChatInput";
import { AIPresenceIcon } from "../shared/NavIcons";

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
          {/* Empty state — 深夜陪伴空间欢迎区 */}
          {messages.length === 0 && !crisisActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="empty-atmosphere"
            >
              {/* 豆包感 AI 陪伴图标 */}
              <div className="relative mx-auto mb-8">
                <div className="breathing-presence w-20 h-20 flex items-center justify-center mx-auto"
                  style={{ color: "var(--accent-400)" }}>
                  <AIPresenceIcon size={44} />
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-serif text-2xl font-medium mb-3 tracking-tight relative z-10"
                style={{ color: "var(--text-primary)" }}
              >
                我在认真听
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="max-w-sm mx-auto leading-relaxed text-sm relative z-10"
                style={{ color: "var(--text-secondary)" }}
              >
                你不用组织语言，想到什么都可以说。
              </motion.p>

              {/* 快捷建议 chips — 玻璃胶囊 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-8 flex flex-wrap justify-center gap-2.5 relative z-10"
              >
                {[
                  "今天让我感恩的三件小事",
                  "我最近做得很棒的一件事",
                  "此刻身体哪个部位最放松",
                  "如果给自己一个拥抱会说什么",
                ].map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => sendMessage(phrase)}
                    className="suggestion-chip"
                  >
                    {phrase}
                  </button>
                ))}
              </motion.div>
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
                className="rounded-2xl px-4 py-3 mb-4 text-sm glass-light"
                style={{
                  background: "color-mix(in srgb, var(--accent-400) 8%, transparent)",
                  borderColor: "color-mix(in srgb, var(--accent-400) 18%, transparent)",
                  color: "var(--accent-300)",
                }}
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
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{
                  background: "var(--bg-glass)",
                  border: "0.5px solid var(--card-border)",
                  color: "var(--accent-300)",
                }}
              >
                M
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[72%]"
                style={{
                  background: "var(--bg-glass)",
                  border: "0.5px solid var(--border-light)",
                  color: "var(--text-primary)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
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
                className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center justify-between glass-light"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.15)",
                  color: "var(--text-primary)",
                }}
              >
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="opacity-60 hover:opacity-100 ml-2 font-medium transition-opacity"
                  style={{ color: "var(--text-secondary)" }}
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
