interface SunIconProps { size?: number; glowing?: boolean; className?: string }

/**
 * 真实感太阳 — 多层径向渐变模拟光球层→色球层→日冕 + 光晕
 */
export default function SunIcon({ size = 24, glowing = false, className = "" }: SunIconProps) {
  const r = size / 2;
  const glowId = `sun-glow-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={glowing ? {
        filter: `drop-shadow(0 0 ${r * 0.5}px rgba(255,200,80,0.4)) drop-shadow(0 0 ${r}px rgba(255,180,40,0.2))`,
      } : undefined}
    >
      <defs>
        {/* 日冕外晕 — 从炽白到透明 */}
        <radialGradient id={`sun-corona-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(255,240,200,0.3)" />
          <stop offset="75%" stopColor="rgba(255,210,140,0.12)" />
          <stop offset="90%" stopColor="rgba(255,180,80,0.03)" />
          <stop offset="100%" stopColor="rgba(255,160,40,0)" />
        </radialGradient>

        {/* 光球层 — 炽白核心 */}
        <radialGradient id={`sun-photosphere-${size}`} cx="45%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fffef5" />
          <stop offset="30%" stopColor="#fff8d0" />
          <stop offset="60%" stopColor="#ffe080" />
          <stop offset="85%" stopColor="#ffb830" />
          <stop offset="100%" stopColor="#e89810" />
        </radialGradient>

        {/* 色球层暗斑 — 模拟太阳黑子微影 */}
        <radialGradient id={`sun-spot1-${size}`} cx="40%" cy="38%" r="10%">
          <stop offset="0%" stopColor="rgba(200,130,30,0.2)" />
          <stop offset="100%" stopColor="rgba(200,130,30,0)" />
        </radialGradient>
        <radialGradient id={`sun-spot2-${size}`} cx="58%" cy="52%" r="8%">
          <stop offset="0%" stopColor="rgba(200,130,30,0.15)" />
          <stop offset="100%" stopColor="rgba(200,130,30,0)" />
        </radialGradient>

        {/* 日冕光线 filter */}
        <filter id={glowId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 日冕光晕 — 最大的柔光环 */}
      <circle cx="50" cy="50" r="48"
        fill={`url(#sun-corona-${size})`}
        filter={glowing ? `url(#${glowId})` : undefined}
      />

      {/* 光球主体 */}
      <circle cx="50" cy="50" r="36"
        fill={`url(#sun-photosphere-${size})`}
      />

      {/* 太阳黑子 */}
      <circle cx="50" cy="50" r="36" fill={`url(#sun-spot1-${size})`} />
      <circle cx="50" cy="50" r="36" fill={`url(#sun-spot2-${size})`} />

      {/* 日冕射线 — 8条微光线 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line key={angle}
          x1="50" y1="18" x2="50" y2="8"
          stroke="rgba(255,240,200,0.2)"
          strokeWidth="0.6"
          strokeLinecap="round"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {/* 边缘暖光 */}
      <circle cx="50" cy="50" r="35.5" fill="none"
        stroke="rgba(255,240,200,0.2)" strokeWidth="0.5" />
    </svg>
  );
}
