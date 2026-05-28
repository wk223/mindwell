import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import EchoPage from "./pages/EchoPage";
import MoodPage from "./pages/MoodPage";
import AssessmentPage from "./pages/AssessmentPage";
import CommunityPage from "./pages/CommunityPage";
import GrowthPage from "./pages/GrowthPage";
import LateNightPage from "./pages/LateNightPage";
import MemoryPage from "./pages/MemoryPage";
import AppShell from "./components/layout/AppShell";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/chat" element={<PrivateRoute><AppShell><ChatPage /></AppShell></PrivateRoute>} />
      <Route path="/echo" element={<PrivateRoute><AppShell><EchoPage /></AppShell></PrivateRoute>} />
      <Route path="/mood" element={<PrivateRoute><AppShell><MoodPage /></AppShell></PrivateRoute>} />
      <Route path="/home" element={<PrivateRoute><AppShell><HomePage /></AppShell></PrivateRoute>} />
      <Route path="/assessment" element={<PrivateRoute><AppShell><AssessmentPage /></AppShell></PrivateRoute>} />
      <Route path="/community" element={<PrivateRoute><AppShell><CommunityPage /></AppShell></PrivateRoute>} />
      <Route path="/growth" element={<PrivateRoute><AppShell><GrowthPage /></AppShell></PrivateRoute>} />
      <Route path="/night" element={<PrivateRoute><AppShell><LateNightPage /></AppShell></PrivateRoute>} />
      <Route path="/memories" element={<PrivateRoute><AppShell><MemoryPage /></AppShell></PrivateRoute>} />
    </Routes>
  );
}
