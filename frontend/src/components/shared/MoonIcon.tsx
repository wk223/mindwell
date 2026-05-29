interface MoonIconProps { size?: number; glowing?: boolean; className?: string }

/**
 * 真实感月亮 — 多层径向渐变模拟月表 + 环形山暗斑 + 柔光晕
 */
export default function MoonIcon({ size = 24, glowing = false, className = "" }: MoonIconProps) {
  const r = size / 2;
  const glowId = `moon-glow-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={glowing ? {
        filter: `drop-shadow(0 0 ${r * 0.6}px rgba(200,180,220,0.25)) drop-shadow(0 0 ${r * 1.2}px rgba(180,160,210,0.12))`,
      } : undefined}
    >
      <defs>
        {/* 月面基底渐变 — 模拟玄武岩暗区（月海） */}
        <radialGradient id={`moon-base-${size}`} cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#f5f0e8" />
          <stop offset="25%" stopColor="#e8dfd0" />
          <stop offset="50%" stopColor="#d4c8b0" />
          <stop offset="75%" stopColor="#c4b598" />
          <stop offset="100%" stopColor="#b0a080" />
        </radialGradient>

        {/* 月海暗斑 1 — 右上大暗区 */}
        <radialGradient id={`moon-mare1-${size}`} cx="60%" cy="35%" r="30%">
          <stop offset="0%" stopColor="rgba(140,130,110,0.35)" />
          <stop offset="60%" stopColor="rgba(140,130,110,0.12)" />
          <stop offset="100%" stopColor="rgba(140,130,110,0)" />
        </radialGradient>

        {/* 月海暗斑 2 — 左下 */}
        <radialGradient id={`moon-mare2-${size}`} cx="30%" cy="60%" r="25%">
          <stop offset="0%" stopColor="rgba(130,120,105,0.3)" />
          <stop offset="100%" stopColor="rgba(130,120,105,0)" />
        </radialGradient>

        {/* 月海暗斑 3 — 中下小斑 */}
        <radialGradient id={`moon-mare3-${size}`} cx="50%" cy="70%" r="18%">
          <stop offset="0%" stopColor="rgba(135,125,108,0.22)" />
          <stop offset="100%" stopColor="rgba(135,125,108,0)" />
        </radialGradient>

        {/* 光晕滤镜 */}
        <filter id={glowId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 柔光外晕 */}
      {glowing && (
        <circle cx="50" cy="50" r="48" fill="none"
          stroke="rgba(200,180,220,0.08)" strokeWidth="2" />
      )}

      {/* 月面主体 */}
      <circle cx="50" cy="50" r="42"
        fill={`url(#moon-base-${size})`}
        filter={glowing ? `url(#${glowId})` : undefined}
      />

      {/* 月海暗斑 */}
      <circle cx="50" cy="50" r="42" fill={`url(#moon-mare1-${size})`} />
      <circle cx="50" cy="50" r="42" fill={`url(#moon-mare2-${size})`} />
      <circle cx="50" cy="50" r="42" fill={`url(#moon-mare3-${size})`} />

      {/* 环形山 — 微小暗点 */}
      <circle cx="42" cy="30" r="2.5" fill="rgba(120,110,95,0.18)" />
      <circle cx="58" cy="48" r="2" fill="rgba(120,110,95,0.14)" />
      <circle cx="35" cy="55" r="1.8" fill="rgba(120,110,95,0.12)" />
      <circle cx="65" cy="62" r="1.5" fill="rgba(120,110,95,0.1)" />
      <circle cx="48" cy="72" r="2.2" fill="rgba(120,110,95,0.15)" />
      <circle cx="55" cy="22" r="1.3" fill="rgba(120,110,95,0.08)" />
      <circle cx="28" cy="40" r="1.6" fill="rgba(120,110,95,0.1)" />

      {/* 边缘微光 — 模拟阳光散射 */}
      <circle cx="50" cy="50" r="41.5" fill="none"
        stroke="rgba(255,250,240,0.15)" strokeWidth="0.8" />
    </svg>
  );
}
