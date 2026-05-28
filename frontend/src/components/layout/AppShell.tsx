import { useAuthStore } from "../../stores/useAuthStore";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import VinylPlayer from "./VinylPlayer";
import AmbientLighting from "./AmbientLighting";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
