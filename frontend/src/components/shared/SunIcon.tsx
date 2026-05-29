interface SunIconProps {
  size?: number;
  glowing?: boolean;
  className?: string;
}

export default function SunIcon({ size = 24, glowing = false, className = "" }: SunIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={glowing ? {
        filter: "drop-shadow(0 0 10px rgba(251,191,36,0.5)) drop-shadow(0 0 24px rgba(251,191,36,0.2))",
      } : undefined}
    >
      {glowing && (
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      {/* 太阳主体 */}
      <circle
        cx="12"
        cy="12"
        r="5"
        fill="url(#sunGradient)"
        filter={glowing ? "url(#sun-glow)" : undefined}
      />
      {/* 光芒射线 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12"
          y1="4"
          x2="12"
          y2="2"
          stroke="url(#sunGradient)"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.7}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <defs>
        <radialGradient id="sunGradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
    </svg>
  );
}
