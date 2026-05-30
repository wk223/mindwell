/** 雨线特效 — CSS only，模拟窗玻璃上的雨滴 */
export default function RainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {/* 远层 — 细疏雨 */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            15deg,
            transparent,
            transparent 40px,
            rgba(96, 165, 250, 0.08) 40px,
            rgba(96, 165, 250, 0.08) 41px
          )`,
          animation: "rain-fall 0.8s linear infinite",
        }}
      />
      {/* 中层 — 中密雨 */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            12deg,
            transparent,
            transparent 25px,
            rgba(96, 165, 250, 0.12) 25px,
            rgba(96, 165, 250, 0.12) 26px
          )`,
          animation: "rain-fall 0.6s linear 0.3s infinite",
        }}
      />
      {/* 近层 — 粗疏雨 */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            10deg,
            transparent,
            transparent 60px,
            rgba(147, 197, 253, 0.1) 60px,
            rgba(147, 197, 253, 0.1) 61px
          )`,
          animation: "rain-fall 1.2s linear 0.6s infinite",
        }}
      />
      {/* 雨滴打击效果 — 微细水平线 */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 80px,
            rgba(255, 255, 255, 0.03) 80px,
            rgba(255, 255, 255, 0.03) 81px
          )`,
          animation: "rain-fall 0.5s linear 0.1s infinite",
        }}
      />
    </div>
  );
}
