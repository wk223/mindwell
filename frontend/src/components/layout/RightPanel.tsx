import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MoonIcon from "../shared/MoonIcon";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const itemAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

export default function RightPanel() {
  const navigate = useNavigate();

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: easeOut, delay: 0.3 }}
      className="w-[280px] shrink-0 flex flex-col h-full relative overflow-hidden"
    >
      {/* ── 绿色渐变背景 + 光效 ── */}
      <div
        className="absolute inset-0 transition-[background] duration-[1.8s]"
        style={{
          background:
            "linear-gradient(180deg, " +
            "color-mix(in srgb, var(--accent-300) 5%, var(--bg-deep)) 0%, " +
            "color-mix(in srgb, var(--accent-400) 8%, var(--bg-mid)) 40%, " +
            "color-mix(in srgb, var(--accent-500) 4%, var(--bg-deep)) 100%)",
        }}
      />
      {/* 光效浮层 — 右上角绿色辉光 */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent-300) 8%, transparent) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "drift-wide 25s ease-in-out infinite",
        }}
      />
      {/* 左下角辅助光 */}
      <div
        className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent-400) 6%, transparent) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "drift-wide 30s ease-in-out 10s infinite",
        }}
      />

      {/* 左侧分割线 */}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />

      <div className="relative z-10 flex flex-col h-full px-5 py-7 overflow-y-auto">
        <motion.div className="space-y-5" variants={stagger} initial="initial" animate="animate">
          {/* Today's mood — 呼吸月亮 */}
          <motion.section
            variants={itemAnim}
            className="p-5 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-300) 6%, var(--bg-glass))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid color-mix(in srgb, var(--accent-400) 15%, transparent)",
              boxShadow: "0 0 30px -10px color-mix(in srgb, var(--accent-400) 10%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              今日心情
            </p>
            <div className="flex items-center gap-4">
              <div className="breathing-presence w-14 h-14 flex items-center justify-center">
                <MoonIcon size={22} glowing />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>平静</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  比昨天更放松
                </p>
              </div>
            </div>
          </motion.section>

          {/* Mood trend */}
          <motion.section
            variants={itemAnim}
            className="p-5 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-300) 6%, var(--bg-glass))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid color-mix(in srgb, var(--accent-400) 15%, transparent)",
              boxShadow: "0 0 30px -10px color-mix(in srgb, var(--accent-400) 10%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              近期情绪
            </p>
            <div className="flex items-end gap-1.5 h-16">
              {[0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.8].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex-1 rounded-full origin-bottom"
                  style={{
                    height: `${v * 100}%`,
                    background: "linear-gradient(to top, var(--accent-500), var(--accent-300))",
                    opacity: 0.5 + v * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.section>

          {/* Daily quote */}
          <motion.section
            variants={itemAnim}
            className="p-5 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-300) 6%, var(--bg-glass))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid color-mix(in srgb, var(--accent-400) 15%, transparent)",
              boxShadow: "0 0 30px -10px color-mix(in srgb, var(--accent-400) 10%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              每日语录
            </p>
            <p className="text-sm leading-relaxed font-serif italic" style={{ color: "var(--text-primary)" }}>
              "你不需要总是坚强，偶尔柔软也是一种力量。"
            </p>
          </motion.section>

          {/* Quick actions */}
          <motion.section
            variants={itemAnim}
            className="p-5 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-300) 6%, var(--bg-glass))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid color-mix(in srgb, var(--accent-400) 15%, transparent)",
              boxShadow: "0 0 30px -10px color-mix(in srgb, var(--accent-400) 10%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              情绪入口
            </p>
            <div className="space-y-1">
              {[
                { label: "开始倾诉", to: "/chat" },
                { label: "ECHO 答案之书", to: "/echo" },
                { label: "深夜陪伴", to: "/night" },
                { label: "情绪日记", to: "/mood" },
                { label: "自我了解", to: "/assessment" },
              ].map((action) => (
                <motion.button
                  key={action.to}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.to)}
                  className="nav-item-hover w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors duration-300"
                  style={{
                    color: "var(--text-secondary)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.background = "var(--bg-glass)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--accent-400)", opacity: 0.5 }}
                  />
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* AI companion status */}
          <motion.section
            variants={itemAnim}
            className="p-5 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent-300) 6%, var(--bg-glass))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "0.5px solid color-mix(in srgb, var(--accent-400) 15%, transparent)",
              boxShadow: "0 0 30px -10px color-mix(in srgb, var(--accent-400) 10%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
              AI 陪伴状态
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success-500 animate-ping opacity-30" />
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>在线陪伴中</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  随时可以倾听
                </p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </motion.aside>
  );
}
