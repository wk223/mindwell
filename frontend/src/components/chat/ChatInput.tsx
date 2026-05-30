import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 pb-4 px-4">
      {/* Glow halo — 使用 CSS token */}
      <div
        className="absolute inset-x-8 -bottom-2 h-20 blur-3xl rounded-full pointer-events-none"
        style={{
          background: "color-mix(in srgb, var(--accent-400) 4%, transparent)",
        }}
      />

      <div className="max-w-3xl mx-auto">
        <div
          className="flex gap-3 items-end p-3 glass-heavy rounded-2xl"
          style={{ backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的感受..."
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm
                       focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed
                       max-h-[150px]"
            style={{ color: "var(--text-primary)" }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="shrink-0 w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center
                       min-w-[44px] min-h-[44px]
                       transition-all duration-300 relative overflow-hidden
                       disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: "var(--bg-glass)",
              border: "0.5px solid var(--card-border)",
              color: "var(--text-secondary)",
            }}
          >
            {/* Inner glow on hover */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500"
              style={{
                background: "linear-gradient(135deg, var(--accent-400) 0%, transparent 60%)",
                opacity: 0,
              }}
            />
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </motion.button>
        </div>
        <p className="text-[11px] text-center mt-2.5 tracking-wide" style={{ color: "var(--text-tertiary)" }}>
          MindWell 不替代专业医疗诊断
        </p>
      </div>
    </div>
  );
}
