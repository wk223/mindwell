import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdviceTopic } from "../../data/advice";

interface Props {
  topic: AdviceTopic;
  onClose: () => void;
}

export default function AdviceOverlay({ topic, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const total = topic.pieces.length;
  const current = topic.pieces[index];

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="glass-heavy rounded-3xl max-w-lg w-full p-8 relative"
        style={{ backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰线 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent-400), transparent)",
            opacity: 0.3,
          }}
        />

        {/* 标题 + 计数器 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            {topic.label}
          </h3>
          <span className="text-xs px-3 py-1 rounded-full" style={{
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-light)",
            color: "var(--text-tertiary)",
          }}>
            {index + 1} / {total}
          </span>
        </div>

        {/* 建议内容 — 带淡入动画 */}
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="text-sm leading-relaxed mb-8 font-serif"
            style={{ color: "var(--text-primary)", letterSpacing: "0.02em", lineHeight: 2.1 }}
          >
            {current}
          </motion.p>
        </AnimatePresence>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            className="text-xs px-4 py-2 rounded-full transition-colors"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-light)",
            }}
          >
            ← 上一篇
          </button>

          {/* 进度点 */}
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 16 : 5,
                  height: 5,
                  background: i === index ? "var(--accent-400)" : "var(--border-light)",
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="text-xs px-4 py-2 rounded-full transition-colors"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-glass)",
              border: "0.5px solid var(--border-light)",
            }}
          >
            下一篇 →
          </button>
        </div>

        {/* 关闭 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
          style={{ color: "var(--text-tertiary)", background: "var(--bg-glass)" }}
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}
