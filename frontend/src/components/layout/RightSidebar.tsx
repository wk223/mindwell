import { useAuthStore } from "../../stores/useAuthStore";
import { useMoodStore } from "../../stores/useMoodStore";
import MoonIcon from "../shared/MoonIcon";

const QUICK_LINKS = [
  { label: "倾诉", to: "/chat", icon: ChatSvg },
  { label: "测评", to: "/assessment", icon: AssessmentSvg },
  { label: "ECHO", to: "/night", icon: MoonSvg },
  { label: "成长", to: "/growth", icon: GrowSvg },
];

function moodEmoji(score: number | undefined): string {
  if (!score) return "—";
  if (score >= 9) return "😊";
  if (score >= 7) return "🙂";
  if (score >= 5) return "😐";
  if (score >= 3) return "😔";
  return "😢";
}

export default function RightSidebar() {
  const user = useAuthStore((s) => s.user);
  const todayEntry = useMoodStore((s) => s.todayEntry);

  return (
    <aside
      className="w-[280px] xl:w-[300px] flex flex-col shrink-0 border-l px-4 xl:px-5 py-6 gap-5 overflow-y-auto"
      style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(229,223,211,0.15)",
      }}
    >
      {/* Companion avatar area */}
      <div className="flex flex-col items-center pt-2 pb-2">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-breathe"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
            }}
          >
            <MoonIcon size={36} glowing />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-mint-400 border-2 border-white" />
        </div>
        <p className="text-sm font-semibold text-gray-700">{user?.nickname || "用户"}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">在线</p>

        {/* Emotional state */}
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full card-tertiary">
          <span className="text-sm">{moodEmoji(todayEntry?.mood_score)}</span>
          <span className="text-[11px] text-gray-500">
            {todayEntry ? todayEntry.mood_label : "今天还没记录心情"}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card-tertiary flex justify-center gap-1.5 py-2.5">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.to}
            href={link.to}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors group"
            title={link.label}
          >
            <link.icon />
            <span className="text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>

      {/* Daily quote */}
      <div className="text-center px-3">
        <p className="text-xs text-gray-400 leading-relaxed italic tracking-wide">
          "你已经很努力了，慢慢来，一切都会好起来的。"
        </p>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto" />

      {/* Crisis link */}
      <div className="text-center">
        <a
          href="tel:400-161-9995"
          className="text-[11px] text-gray-400 hover:text-blush-500 transition-colors tracking-wider"
        >
          需要帮助？
        </a>
      </div>
    </aside>
  );
}

/* SVG icons for quick actions */
function ChatSvg() {
  return (
    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-mint-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function AssessmentSvg() {
  return (
    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function MoonSvg() {
  return (
    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function GrowSvg() {
  return (
    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-lavender-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
