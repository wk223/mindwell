import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { cn } from "../../utils/cn";

const tabs = [
  { to: "/chat", label: "倾诉", icon: ChatTabIcon },
  { to: "/mood", label: "心情", icon: MoodTabIcon },
  { to: "/night", label: "小智", icon: NightTabIcon },
  { to: "/assessment", label: "测评", icon: AssessmentTabIcon },
  { to: "/echo", label: "ECHO", icon: EchoTabIcon },
];

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex flex-col h-screen w-full bg-void-950">
      {/* Header */}
      <header className="shrink-0 bg-void-900/80 backdrop-blur border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌙</span>
          <h1 className="font-serif text-base font-medium text-slate-200">观心</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="shrink-0 bg-white/[0.02] px-4 py-1.5 text-xs text-slate-500">
        你好，{user?.nickname || "用户"}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom nav */}
      <nav className="shrink-0 bg-void-900/80 backdrop-blur border-t border-white/[0.04] flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-moon-400" : "text-slate-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function ChatTabIcon(a: boolean) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function MoodTabIcon(a: boolean) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function NightTabIcon(a: boolean) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}
function AssessmentTabIcon(a: boolean) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function EchoTabIcon(a: boolean) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.76A7.08 7.08 0 0112 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l2 4-2 2-2-2 2-4z" />
    </svg>
  );
}
