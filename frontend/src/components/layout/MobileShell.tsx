import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { cn } from "../../utils/cn";
import { HomeIcon, ChatIcon, MoodIcon, AssessmentIcon, NightIcon } from "../shared/NavIcons";

const tabs = [
  { to: "/home", label: "首页", icon: HomeIcon },
  { to: "/chat", label: "倾诉", icon: ChatIcon },
  { to: "/mood", label: "心情", icon: MoodIcon },
  { to: "/assessment", label: "了解", icon: AssessmentIcon },
  { to: "/night", label: "陪伴", icon: NightIcon },
];

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex flex-col h-screen w-full" style={{ background: "var(--bg-deep)" }}>
      {/* Header */}
      <header
        className="shrink-0 backdrop-blur px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--bg-mid)",
          borderBottom: "0.5px solid var(--border-light)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* CSS crescent moon */}
          <div
            className="w-6 h-6 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, var(--accent-300) 0%, var(--accent-400) 50%, var(--accent-500) 100%)",
              boxShadow: "0 0 10px -2px var(--accent-400)",
            }}
          />
          <h1 className="font-serif text-base font-medium" style={{ color: "var(--text-primary)" }}>
            观心
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={logout}
            className="p-1.5 rounded-xl transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="shrink-0 px-4 py-1.5 text-xs" style={{ color: "var(--text-tertiary)", background: "var(--bg-glass)" }}>
        你好，{user?.nickname || "用户"}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom nav — moonlight active */}
      <nav
        className="shrink-0 backdrop-blur flex"
        style={{
          background: "var(--bg-mid)",
          borderTop: "0.5px solid var(--border-light)",
        }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all duration-300",
                isActive ? "nav-item-active" : ""
              )
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-400)" : "var(--text-tertiary)",
            })}
          >
            {({ isActive }) => (
              <>
                <tab.icon size={20} active={isActive} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
