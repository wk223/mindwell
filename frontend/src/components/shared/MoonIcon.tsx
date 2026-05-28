interface MoonIconProps {
  size?: number;
  glowing?: boolean;
  className?: string;
}

export default function MoonIcon({ size = 24, glowing = false, className = "" }: MoonIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={glowing ? {
        filter: "drop-shadow(0 0 8px rgba(251,191,36,0.4)) drop-shadow(0 0 20px rgba(251,191,36,0.15))",
      } : undefined}
    >
      {glowing && (
        <defs>
          <filter id="moon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        fill="url(#moonGradient)"
        stroke="url(#moonGradient)"
        strokeWidth={0.5}
        filter={glowing ? "url(#moon-glow)" : undefined}
      />
      <defs>
        <linearGradient id="moonGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.4" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
