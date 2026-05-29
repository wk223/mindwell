import { motion } from "framer-motion";
import type { Message } from "../../types/dialogue";
import { cn } from "../../utils/cn";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

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
      className={cn("flex gap-3 mb-5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
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

      {/* Bubble — glassmorphism */}
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
    </motion.div>
  );
}
