import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/useAuthStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--bg-deep)" }}>
      {/* 深空光球 */}
      <div className="deep-space-orb deep-space-orb-moon absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px]" />
      {/* 星光 */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="star-dot absolute" style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          {/* MoonIcon */}
          <div className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-glass)", border: "0.5px solid var(--card-border)", boxShadow: "0 0 30px -8px var(--breathing-color)" }}
          >
            <div className="w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, var(--accent-300) 0%, var(--accent-400) 50%, var(--accent-500) 100%)", boxShadow: "0 0 12px -2px var(--accent-400)" }} />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>观心</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>欢迎回来，继续你的心灵旅程</p>
        </div>

        <div className="glass-heavy rounded-3xl p-8">
          <h2 className="font-serif text-xl font-medium mb-6" style={{ color: "var(--text-primary)" }}>登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                邮箱
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--bg-glass)", border: "0.5px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                密码
              </label>
              <input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--bg-glass)", border: "0.5px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            {error && (
              <p className="text-sm px-4 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.15)", color: "var(--text-secondary)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-glow text-base py-3 disabled:opacity-50"
            >
              {isLoading ? "..." : "登录"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
            还没有账号？{" "}
            <Link to="/register" className="font-medium transition-colors" style={{ color: "var(--accent-400)" }}>
              注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
