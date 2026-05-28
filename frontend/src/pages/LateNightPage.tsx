import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NightChat from "../components/night/NightChat";
import Particles from "../components/night/Particles";
import "../components/night/night.css";

const FOOTER_LINES = [
  "今晚也辛苦了。",
  "夜深了，但你不是一个人。",
  "有些情绪只属于黑夜。",
  "没关系，慢慢来。",
  "这个世界允许你暂停。",
  "你已经做得很好了。",
  "今晚的星星会替你记住。",
];

export default function LateNightPage() {
  const navigate = useNavigate();
  const [footerLine, setFooterLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFooterLine((i) => (i + 1) % FOOTER_LINES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full relative overflow-hidden" style={{ background: "#020617" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(56,189,248,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.04) 0%, transparent 50%)",
        }}
      />

      <Particles />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center pt-4 sm:pt-6 pb-2 px-4">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 -ml-1 mr-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <span className="text-slate-200 text-sm sm:text-base tracking-wider">AI 倾诉</span>
            <span className="hidden sm:inline text-slate-500 text-xs ml-1.5">· 深夜陪伴</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NightChat />
        </div>

        <div className="text-center pb-4 sm:pb-6 pt-2 px-4 space-y-2">
          <p
            key={footerLine}
            className="text-xs sm:text-sm text-slate-400 tracking-wider animate-night-fade-in"
          >
            {FOOTER_LINES[footerLine]}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500/40">
            观心团队 · 愿每个夜晚都有人倾听
          </p>
        </div>
      </div>
    </div>
  );
}
