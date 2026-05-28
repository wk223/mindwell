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
      {/* Glow halo behind the input bar */}
      <div className="absolute inset-x-8 -bottom-2 h-20 bg-moon-400/5 blur-3xl rounded-full" />

      <div className="max-w-3xl mx-auto">
        <div
          className="flex gap-3 items-end p-3 rounded-2xl border border-white/[0.07] bg-white/[0.03]"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的感受..."
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-200
                       placeholder:text-slate-600 focus:outline-none
                       disabled:opacity-40 disabled:cursor-not-allowed
                       max-h-[150px]"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                       bg-white/[0.06] border border-white/[0.08] text-slate-400
                       hover:bg-white/[0.1] hover:text-slate-200 hover:border-white/[0.12]
                       disabled:opacity-20 disabled:cursor-not-allowed
                       transition-all duration-300 relative overflow-hidden"
          >
            {/* Inner glow on send button */}
            <div className="absolute inset-0 bg-gradient-to-tr from-moon-400/0 to-moon-400/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
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
        <p className="text-[11px] text-slate-600 text-center mt-2.5 tracking-wide">
          MindWell 不替代专业医疗诊断
        </p>
      </div>
    </div>
  );
}
