/**
 * 氛围光 — 全屏光球，使用 CSS Variables 跟随日夜+情绪切换
 * 三个光球：右上主色 / 左下辅色 / 中心暖光
 */
export default function AmbientLighting() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 右上主色光球 — 跟随 accent */}
      <div
        className="absolute -top-[15%] -right-[8%] w-[55%] h-[55%] rounded-full deep-space-orb-moon"
      />

      {/* 左下辅色光球 — 冷紫/暖绿 */}
      <div
        className="absolute -bottom-[8%] -left-[8%] w-[45%] h-[45%] rounded-full deep-space-orb-warm"
      />

      {/* 中心柔光 — 低强度，减少大面积暗区 */}
      <div
        className="absolute top-[25%] left-[25%] w-[40%] h-[40%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--particle-color-warm) 40%, transparent) 0%, transparent 60%)",
          filter: "blur(100px)",
          animation: "drift-wide 40s ease-in-out 15s infinite",
          opacity: 0.5,
        }}
      />
    </div>
  );
}
