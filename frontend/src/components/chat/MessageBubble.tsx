import { motion } from "framer-motion";
import type { Message } from "../../types/dialogue";
import { cn } from "../../utils/cn";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={cn("flex gap-3 mb-5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium border",
          isUser
            ? "bg-white/[0.06] border-white/[0.08] text-slate-400"
            : "bg-white/[0.06] border-white/[0.08] text-lavender-300"
        )}
      >
        {isUser ? "我" : "M"}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-tr-sm shadow-inner-glow"
            : "bg-white/[0.03] border border-white/[0.05] text-slate-300 rounded-tl-sm shadow-inner-glow"
        )}
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.agentId && (
          <span className="block mt-1.5 text-[11px] text-slate-600">
            {message.agentId === "crisis" ? "安全助手" : "MindWell AI"}
          </span>
        )}
      </div>
    </motion.div>
  );
}
