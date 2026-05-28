import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { cn } from "../../utils/cn";

const tabs = [
  { to: "/", label: "首页", icon: HomeTabIcon },
  { to: "/chat", label: "倾诉", icon: ChatTabIcon },
  { to: "/night", label: "ECHO", icon: NightTabIcon },
  { to: "/growth", label: "成长", icon: GrowTabIcon },
  { to: "/myspace", label: "我的", icon: SpaceTabIcon },
];

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggle = useLayoutStore((s) => s.toggle);
  const manualOverride = useLayoutStore((s) => s.manualOverride);

  return (
    <div className="flex flex-col h-screen w-full max-w-lg mx-auto sm:border-x border-cream-200 sm:shadow-xl"
      style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(20px)" }}>
      <header className="shrink-0 bg-white/80 backdrop-blur border-b border-cream-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-base font-bold text-gray-800">观心</h1>
          {manualOverride && (
            <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">手动</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-cream-100 transition-colors" title={manualOverride ? "切回自动检测" : "切换桌面版"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={logout} className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-cream-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="shrink-0 bg-mint-50 px-4 py-1.5 text-xs text-mint-600">你好，{user?.nickname || "用户"}</div>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="shrink-0 bg-white/80 backdrop-blur border-t border-cream-200 flex">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to}
            className={({ isActive }) => cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors", isActive ? "text-mint-600" : "text-gray-400")}>
            {({ isActive }) => (<>{tab.icon(isActive)}<span>{tab.label}</span></>)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function HomeTabIcon(a: boolean) {
  return <svg className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function ChatTabIcon(a: boolean) {
  return <svg className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function NightTabIcon(a: boolean) {
  return <svg className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
}
function GrowTabIcon(a: boolean) {
  return <svg className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}
function SpaceTabIcon(a: boolean) {
  return <svg className="w-5 h-5" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
