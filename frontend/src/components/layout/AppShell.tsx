import { useEffect } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setMobile]);

  if (isMobile) {
    return (
      <>
        <AmbientLighting />
        <MobileShell>{children}</MobileShell>
        <VinylPlayer />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AmbientLighting />
      <Sidebar userNickname={user?.nickname || "User"} onLogout={logout} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        {children}
      </main>
      <RightPanel />
      <VinylPlayer />
    </div>
  );
}
