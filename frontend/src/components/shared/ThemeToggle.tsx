import { motion } from "framer-motion";
import { useDayNight } from "../../hooks/useDayNight";
import SunIcon from "../shared/SunIcon";
import MoonIcon from "../shared/MoonIcon";

/**
 * 日夜切换按钮
 * - 点击切换：日 ⇄ 夜
 * - 长按/双击恢复自动模式
 */
export default function ThemeToggle() {
  const { mode, toggle, resetToAuto } = useDayNight();
  const isDay = mode === "day";

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      onDoubleClick={resetToAuto}
      className="relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-500"
      style={{
        background: "var(--bg-glass)",
        border: "0.5px solid var(--card-border)",
        boxShadow: "0 2px 12px -4px rgba(0,0,0,0.1)",
      }}
      title={isDay ? "切换至深夜模式" : "切换至日间模式（双击恢复自动）"}
    >
      {/* 滑动指示器 */}
      <motion.div
        className="absolute inset-y-1 left-1 rounded-full"
        style={{
          background: isDay
            ? "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(134,239,172,0.2))"
            : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(125,211,252,0.2))",
          boxShadow: isDay
            ? "0 0 12px -2px rgba(251,191,36,0.2)"
            : "0 0 12px -2px rgba(139,92,246,0.2)",
        }}
        animate={{
          width: 28,
          left: isDay ? 4 : undefined,
          right: isDay ? undefined : 4,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />

      {/* 图标 */}
      <span className="relative z-10 w-5 h-5 flex items-center justify-center">
        {isDay ? <SunIcon size={16} glowing /> : <MoonIcon size={16} glowing />}
      </span>

      {/* 标签 */}
      <span
        className="relative z-10 text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {isDay ? "日间" : "深夜"}
      </span>
    </motion.button>
  );
}
