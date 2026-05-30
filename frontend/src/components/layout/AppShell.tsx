import { useEffect } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { useDayNight } from "../../hooks/useDayNight";
import { useMoodTheme } from "../../hooks/useMoodTheme";
import RainOverlay from "../atmosphere/RainOverlay";
import FogOverlay from "../atmosphere/FogOverlay";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import MobileShell from "./MobileShell";
import VinylPlayer from "./VinylPlayer";
import AmbientLighting from "./AmbientLighting";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isMobile = useLayoutStore((s) => s.isMobile);
  const setMobile = useLayoutStore((s) => s.setMobile);
  useDayNight();   // 驱动日夜主题 CSS class 切换（.night-theme）
  const { theme } = useMoodTheme(); // 驱动情绪天气 CSS class 切换（.mood-anxious/.mood-calm/.mood-happy）

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setMobile]);

  const weatherLayer = theme === "anxious" && (
    <>
      <RainOverlay />
      <FogOverlay />
    </>
  );

  if (isMobile) {
    return (
      <>
        <AmbientLighting />
        {weatherLayer}
        <MobileShell>{children}</MobileShell>
        <VinylPlayer />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AmbientLighting />
      {weatherLayer}
      <Sidebar userNickname={user?.nickname || "User"} onLogout={logout} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        {children}
      </main>
      <RightPanel />
      <VinylPlayer />
    </div>
  );
}
