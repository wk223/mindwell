import { motion } from "framer-motion";
import { useDayNight } from "../../hooks/useDayNight";
import SunIcon from "../shared/SunIcon";
import MoonIcon from "../shared/MoonIcon";

export default function ThemeToggle() {
  const { mode, toggle, resetToAuto, isManualOverride } = useDayNight();
  const isDay = mode === "day";

  return (
    <div className="flex items-center gap-2">
      {/* 主切换按钮 */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggle}
        className="relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-500"
        style={{
          background: "var(--bg-glass)",
          border: "0.5px solid var(--card-border)",
          boxShadow: "0 2px 12px -4px rgba(0,0,0,0.1)",
        }}
        title={isDay ? "切换至深夜模式" : "切换至日间模式"}
      >
        <motion.div
          className="absolute inset-y-1 rounded-full"
          style={{
            background: isDay
              ? "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(134,239,172,0.2))"
              : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(125,211,252,0.2))",
            boxShadow: isDay
              ? "0 0 12px -2px rgba(251,191,36,0.2)"
              : "0 0 12px -2px rgba(139,92,246,0.2)",
          }}
          animate={{ width: 28, left: isDay ? 4 : undefined, right: isDay ? undefined : 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
        <span className="relative z-10 w-5 h-5 flex items-center justify-center">
          {isDay ? <SunIcon size={16} glowing /> : <MoonIcon size={16} glowing />}
        </span>
        <span className="relative z-10 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {isDay ? "日间" : "深夜"}
        </span>
      </motion.button>

      {/* 手动覆盖时显示恢复自动按钮 */}
      {isManualOverride && (
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={resetToAuto}
          className="text-[10px] px-2 py-1 rounded-full transition-colors"
          style={{
            color: "var(--text-tertiary)",
            background: "var(--bg-glass)",
            border: "0.5px solid var(--border-light)",
          }}
          title="恢复自动模式"
        >
          自动
        </motion.button>
      )}
    </div>
  );
}
