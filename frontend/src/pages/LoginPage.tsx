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
    <div className="min-h-screen flex items-center justify-center bg-void-950 px-4 relative">
      {/* Moonlight glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(ellipse, rgba(200,180,220,1) 0%, transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-slate-100 tracking-tight">观心</h1>
          <p className="text-slate-500 mt-2 text-sm">欢迎回来，继续你的心灵旅程</p>
        </div>

        <div
          className="rounded-3xl p-8 border border-white/[0.07] bg-white/[0.03]"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <h2 className="font-serif text-xl font-medium text-slate-200 mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1.5">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]
                           text-slate-200 placeholder:text-slate-600
                           focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.06]
                           transition-all duration-300 text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1.5">
                密码
              </label>
              <input
                id="password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]
                           text-slate-200 placeholder:text-slate-600
                           focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.06]
                           transition-all duration-300 text-sm"
              />
            </div>
            {error && (
              <p className="text-rose-300 text-sm bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-400/15">
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

          <p className="text-center text-sm text-slate-600 mt-6">
            还没有账号？{" "}
            <Link to="/register" className="text-moon-400 hover:text-moon-300 font-medium transition-colors">
              注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
