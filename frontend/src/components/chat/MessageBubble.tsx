import { useState } from "react";
import { motion } from "framer-motion";
import type { Message } from "../../types/dialogue";
import { cn } from "../../utils/cn";

interface MessageBubbleProps {
  message: Message;
}

/** 本地存储反馈记录 */
const FEEDBACK_KEY = "mindwell_msg_feedback";
function getFeedback(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "{}"); } catch { return {}; }
}
function saveFeedback(id: string, v: string) {
  const fb = getFeedback();
  fb[id] = v;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const saved = getFeedback()[message.id];
  const initial: "up" | "down" | null = (saved === "up" || saved === "down") ? saved : null;
  const [feedback, setFeedbackState] = useState<"up" | "down" | null>(initial);

  const handleFeedback = (v: "up" | "down") => {
    if (feedback === v) return;
    saveFeedback(v, message.id);
    setFeedbackState(v);
  };

  const renderAgentLabel = () => {
    const agent = (message as any).agent_id || message.agentId;
    if (!agent || isUser) return null;
    return (
      <span className="block mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {agent === "crisis" ? "安全助手" : "MindWell AI"}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={cn("flex gap-3 mb-5 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
        style={{
          background: isUser ? "var(--bg-glass)" : "var(--bg-card)",
          border: "0.5px solid var(--card-border)",
          color: isUser ? "var(--text-secondary)" : "var(--accent-300)",
        }}
      >
        {isUser ? "我" : "M"}
      </div>

      <div className="relative">
        <div
          className="max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: isUser
              ? "color-mix(in srgb, var(--bg-card) 80%, transparent)"
              : "var(--bg-glass)",
            border: "0.5px solid var(--card-border)",
            color: "var(--text-primary)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {renderAgentLabel()}
        </div>

        {/* AI 消息反馈按钮 */}
        {!isUser && (
          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleFeedback("up")}
              className="p-1 rounded-md transition-all hover:scale-110"
              style={{
                color: feedback === "up" ? "var(--accent-400)" : "var(--text-tertiary)",
                opacity: feedback === "up" ? 1 : 0.5,
              }}
              title="回答有帮助"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={feedback === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg>
            </button>
            <button
              onClick={() => handleFeedback("down")}
              className="p-1 rounded-md transition-all hover:scale-110"
              style={{
                color: feedback === "down" ? "var(--accent-400)" : "var(--text-tertiary)",
                opacity: feedback === "down" ? 1 : 0.5,
              }}
              title="回答需改进"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={feedback === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V4H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/></svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
