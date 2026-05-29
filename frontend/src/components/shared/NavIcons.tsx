/**
 * 「观心」自定义导航图标
 * 手绘风格 SVG，温暖而有辨识度
 */
interface IconProps { size?: number; active?: boolean }

/* ── 首页 — 小屋灯火 ── */
export function HomeIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 屋顶 */}
      <path d="M3 10L12 3l9 7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* 烟囱 */}
      <path d="M16 7v-1.5a1 1 0 00-1-1h-1" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
      {/* 墙体 */}
      <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      {/* 门 */}
      <rect x="10" y="15" width="4" height="5" rx="1" stroke="currentColor" strokeWidth={1.3} />
      {/* 窗户 + 灯光 */}
      <rect x="7" y="13" width="3" height="3" rx="0.8" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.2} opacity={active ? 0.35 : 0.5} />
      <rect x="14" y="13" width="3" height="3" rx="0.8" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.2} opacity={active ? 0.35 : 0.5} />
    </svg>
  );
}

/* ── 倾诉 — 对话气泡 ── */
export function ChatIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 大气泡 */}
      <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3l-3 3-3-3H6a2 2 0 01-2-2V6z"
        stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      {/* 气泡内小圆点 — 对话进行中 */}
      <circle cx="9" cy="10" r="1.2" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.2} opacity={active ? 0.5 : 0.4} />
      <circle cx="12" cy="10" r="1.2" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.2} opacity={active ? 0.6 : 0.4} />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" opacity={active ? 0.7 : 0.4} />
    </svg>
  );
}

/* ── ECHO 答案之书 — 翻开的书 + 星 ── */
export function EchoIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 左页 */}
      <path d="M12 5v14M4 7v10a1.5 1.5 0 001.5 1.5H12V5H5.5A1.5 1.5 0 004 7z"
        stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      {/* 右页 */}
      <path d="M12 5v14h6.5A1.5 1.5 0 0020 17V7a1.5 1.5 0 00-1.5-1.5H12z"
        stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      {/* 书脊装饰星 */}
      <path d="M12 10l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4L12 10z"
        fill={active ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth={0.8} opacity={active ? 0.5 : 0.3} />
    </svg>
  );
}

/* ── 情绪日记 — 手绘心形 ── */
export function MoodIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 4 14.5 4 9a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 5.5-8 12-8 12z"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      {/* 心内小波纹 — 情绪波动感 */}
      {active && (
        <path d="M9 10.5c1-.5 2 0 3-1s2 .5 3-1"
          stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      )}
    </svg>
  );
}

/* ── 自我了解 — 导航星 ── */
export function AssessmentIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 外环 — 指南针 */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      {/* 十字准线 */}
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" opacity={0.5} />
      {/* 棱形核心 — 内在自我 */}
      <path d="M12 6l3 6-3 6-3-6 3-6z" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"
        opacity={active ? 0.3 : 0.5} />
    </svg>
  );
}

/* ── 深夜陪伴 — 弯月 + 微星 ── */
export function NightIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 弯月 */}
      <path d="M20 14.5A7.5 7.5 0 0110.5 4a7.5 7.5 0 109 10.5z"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      {/* 伴星 */}
      <circle cx="6" cy={active ? 8 : 9} r="1" fill="currentColor" opacity={active ? 0.6 : 0.3} />
      <circle cx={active ? 18 : 17} cy={active ? 17 : 16} r="0.7" fill="currentColor" opacity={active ? 0.4 : 0.2} />
    </svg>
  );
}

/* ── 情绪星图 — 轨道 + 星 ── */
export function UniverseIcon({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 椭圆轨道 */}
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth={1.2}
        strokeDasharray="2 2" opacity={active ? 0.5 : 0.25}
        transform="rotate(-20 12 12)" />
      {/* 中心星 */}
      <circle cx="12" cy="12" r="2.5" fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth={1.3} opacity={active ? 0.5 : 0.4} />
      {/* 轨道上的星球 */}
      <circle cx="5" cy="9" r="1.5" fill="currentColor" opacity={active ? 0.6 : 0.3} />
      <circle cx="19" cy="13" r="1" fill="currentColor" opacity={active ? 0.4 : 0.2} />
    </svg>
  );
}

/* ── 豆包感 AI 陪伴图标 — 柔软云朵 + 暖光 ── */
export function AIPresenceIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* 外层柔光 */}
      <circle cx="32" cy="30" r="22" fill="currentColor" opacity="0.06" />
      {/* 云朵主体 — 圆润叠加 */}
      <ellipse cx="24" cy="34" rx="12" ry="9" fill="currentColor" opacity="0.18" />
      <ellipse cx="38" cy="34" rx="14" ry="10" fill="currentColor" opacity="0.22" />
      <ellipse cx="32" cy="28" rx="16" ry="11" fill="currentColor" opacity="0.25" />
      <circle cx="28" cy="24" r="7" fill="currentColor" opacity="0.3" />
      <circle cx="36" cy="23" r="8" fill="currentColor" opacity="0.28" />
      {/* 暖色核心 — 小太阳 */}
      <circle cx="32" cy="30" r="5" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="30" r="2.5" fill="#fef3c7" opacity="0.8" />
      {/* 底部微光 */}
      <ellipse cx="32" cy="42" rx="10" ry="2" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

/* ── ECHO 主视觉图标 — 翻开的书 + 星光 + 宇宙环 ── */
export function EchoHeroIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* 外环 — 宇宙轨迹 */}
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="0.6" opacity="0.2"
        strokeDasharray="3 5" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="0.4" opacity="0.12" />
      {/* 左书页 */}
      <path d="M32 12v28M14 20v18a2 2 0 002 2h16V12H16a2 2 0 00-2 2z"
        fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 右书页 */}
      <path d="M32 12v28h16a2 2 0 002-2V20a2 2 0 00-2-2H32z"
        fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 书脊星光 */}
      <path d="M32 18l1.5 3.2 3.5.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.5-.5L32 18z"
        fill="currentColor" opacity="0.45" />
      {/* 右上伴星 */}
      <circle cx="46" cy="16" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="50" cy="20" r="1" fill="currentColor" opacity="0.2" />
      {/* 左下伴星 */}
      <circle cx="18" cy="46" r="1.2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}
