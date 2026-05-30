/**
 * 「观心」系统图标
 * 统一线宽、圆角和激活态，用 currentColor 继承主题 token。
 */
import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  active?: boolean;
}

const stroke = 1.65;

function IconSvg({
  size = 20,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function GlowDot({ cx, cy, active }: { cx: number; cy: number; active?: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={active ? 1.45 : 1.1} fill="currentColor" stroke="none" opacity={active ? 0.62 : 0.32} />
      {active && <circle cx={cx} cy={cy} r={2.6} fill="currentColor" stroke="none" opacity={0.08} />}
    </>
  );
}

export function HomeIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <path d="M4.5 10.3 12 4.4l7.5 5.9" />
      <path d="M6.4 9.8v8.3c0 .9.6 1.5 1.5 1.5h8.2c.9 0 1.5-.6 1.5-1.5V9.8" />
      <path d="M10 19.5v-4.2c0-.7.5-1.2 1.2-1.2h1.6c.7 0 1.2.5 1.2 1.2v4.2" opacity={active ? 0.95 : 0.72} />
      <path d="M8.2 12.3h1.9M13.9 12.3h1.9" opacity={active ? 0.9 : 0.42} />
      {active && <path d="M8.2 16.8h1.1" opacity={0.45} />}
    </IconSvg>
  );
}

export function ChatIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <path
        d="M5.4 5.2h13.2c1 0 1.8.8 1.8 1.8v7.1c0 1-.8 1.8-1.8 1.8h-4.1L12 19.3l-2.5-3.4H5.4c-1 0-1.8-.8-1.8-1.8V7c0-1 .8-1.8 1.8-1.8Z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.08 : 0}
      />
      <path d="M8.2 10.4h.01M12 10.4h.01M15.8 10.4h.01" strokeWidth={2.4} opacity={active ? 0.72 : 0.45} />
    </IconSvg>
  );
}

export function EchoIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <path
        d="M12 6.2c-1.9-1-4-1.4-6.2-1.1-.8.1-1.3.8-1.3 1.6v10.8c0 .8.7 1.4 1.5 1.3 2.1-.2 4.2.2 6 1.2V6.2Z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.07 : 0}
      />
      <path
        d="M12 6.2c1.9-1 4-1.4 6.2-1.1.8.1 1.3.8 1.3 1.6v10.8c0 .8-.7 1.4-1.5 1.3-2.1-.2-4.2.2-6 1.2V6.2Z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.07 : 0}
      />
      <path d="M8 9h1.8M8 12h1.5M14.2 9H16M14.2 12h1.5" opacity={0.28} />
      <path d="m12 8.8.8 1.7 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.7Z" fill="currentColor" stroke="none" opacity={active ? 0.48 : 0.24} />
    </IconSvg>
  );
}

export function MoodIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <path
        d="M12 20.2S4.8 14.8 4.8 9.8A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7.2 2.8c0 5-7.2 10.4-7.2 10.4Z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
      />
      <path d="M8.6 12.1c1.1-.7 2.1.7 3.3 0 1.3-.7 2.1.7 3.5-.1" opacity={active ? 0.72 : 0.36} />
    </IconSvg>
  );
}

export function AssessmentIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <circle cx="12" cy="12" r="8.3" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.06 : 0} />
      <path d="M12 3.7v2.1M12 18.2v2.1M3.7 12h2.1M18.2 12h2.1" opacity={0.42} />
      <path d="m12 7 3.1 5-3.1 5-3.1-5L12 7Z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.14 : 0} />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" opacity={active ? 0.65 : 0.34} />
    </IconSvg>
  );
}

export function NightIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <path
        d="M19.5 14.4A7.4 7.4 0 0 1 9.7 4.6 8.1 8.1 0 1 0 19.5 14.4Z"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <GlowDot cx={6.6} cy={8.4} active={active} />
      <circle cx="17.8" cy="6.4" r="0.75" fill="currentColor" stroke="none" opacity={active ? 0.44 : 0.2} />
    </IconSvg>
  );
}

export function UniverseIcon({ size = 20, active }: IconProps) {
  return (
    <IconSvg size={size}>
      <ellipse cx="12" cy="12" rx="8.8" ry="3.7" transform="rotate(-18 12 12)" opacity={active ? 0.55 : 0.28} />
      <ellipse cx="12" cy="12" rx="8.8" ry="3.7" transform="rotate(42 12 12)" opacity={active ? 0.32 : 0.18} />
      <circle
        cx="12"
        cy="12"
        r="2.35"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      />
      <GlowDot cx={5.6} cy={9.4} active={active} />
      <circle cx="18.8" cy="14.1" r="0.85" fill="currentColor" stroke="none" opacity={active ? 0.45 : 0.22} />
    </IconSvg>
  );
}

export function AIPresenceIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="31" r="24" fill="currentColor" opacity="0.055" />
      <path
        d="M18 36.5c0-6.4 4.5-10.5 10.1-10.7C30 21.4 34 19 38.4 20.1c4.6 1.2 7.4 4.9 7.3 9.5 4.3.9 7.3 4.3 7.3 8.8 0 5.4-4.1 9.2-10 9.2H25.5C21 47.6 18 43.1 18 36.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M24.5 36.4c2.8-1.9 5.2 1.9 8.4 0 3.5-2.1 5.6 1.8 9.2-.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="32" cy="30" r="5.2" fill="currentColor" opacity="0.46" />
      <circle cx="32" cy="30" r="2.4" fill="#fef3c7" opacity="0.9" />
      <ellipse cx="32" cy="50.5" rx="12" ry="2.2" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

export function EchoHeroIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="echo-hero-glow" cx="50%" cy="46%" r="54%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="58%" stopColor="currentColor" stopOpacity="0.045" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="36" cy="36" r="33" fill="url(#echo-hero-glow)" />
      <ellipse cx="36" cy="37" rx="26" ry="9" stroke="currentColor" strokeWidth="0.8" opacity="0.16" transform="rotate(-18 36 37)" />
      <ellipse cx="36" cy="37" rx="26" ry="9" stroke="currentColor" strokeWidth="0.55" opacity="0.1" transform="rotate(42 36 37)" />
      <path
        d="M36 16c-7-3.3-14.4-4.6-22-3.7-1.5.2-2.5 1.5-2.5 3v35.1c0 1.6 1.4 2.8 3 2.6 7.5-.8 14.7.6 21.5 4V16Z"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M36 16c7-3.3 14.4-4.6 22-3.7 1.5.2 2.5 1.5 2.5 3v35.1c0 1.6-1.4 2.8-3 2.6-7.5-.8-14.7.6-21.5 4V16Z"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M22 25h8M22 32h7M22 39h6M42 25h8M42 32h7M42 39h6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.2" />
      <path d="m36 27 1.8 3.8 4.1.6-3 2.9.7 4.1-3.6-2-3.6 2 .7-4.1-3-2.9 4.1-.6L36 27Z" fill="currentColor" opacity="0.5" />
      <circle cx="36" cy="8" r="1.4" fill="currentColor" opacity="0.28" />
      <circle cx="48" cy="12" r="0.9" fill="currentColor" opacity="0.22" />
      <circle cx="24" cy="11" r="1" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
