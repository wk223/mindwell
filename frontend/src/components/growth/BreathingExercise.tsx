import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

type Phase = "idle" | "inhale" | "hold" | "exhale";

const CYCLES = [
  { phase: "inhale" as Phase, label: "吸气", seconds: 4, scale: 1.8, color: "var(--accent-300)" },
  { phase: "hold" as Phase,   label: "屏息", seconds: 7, scale: 1.8, color: "var(--accent-400)" },
  { phase: "exhale" as Phase, label: "呼气", seconds: 8, scale: 0.6, color: "var(--accent-300)" },
];

export default function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [rounds, setRounds] = useState(0);
  const timerRef = useRef<number | null>(null);

  const current = CYCLES[cycleIdx];

  useEffect(() => {
    if (!running) return;
    setCountdown(current.seconds);

    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 切换到下一阶段
          setCycleIdx((c) => {
            const next = c + 1;
            if (next >= CYCLES.length) {
              setRounds((r) => r + 1);
              return 0;
            }
            return next;
          });
          return 0; // 下一帧会 reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, cycleIdx]);

  const start = () => {
    setRunning(true);
    setCycleIdx(0);
    setRounds(0);
  };
  const stop = () => {
    setRunning(false);
    setCycleIdx(0);
    setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="card-secondary flex flex-col items-center py-8 px-4">
      <h3 className="font-serif text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>
        呼吸练习
      </h3>
      <p className="text-xs mb-8" style={{ color: "var(--text-secondary)" }}>
        4-7-8 呼吸法 · 缓解焦虑 · 助眠
      </p>

      {/* 呼吸圆环 */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-6">
        {/* 背景光晕 */}
        {running && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${current.color} 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: CYCLES.reduce((a, c) => a + c.seconds, 0), repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* 呼吸球 */}
        <motion.div
          className="rounded-full"
          style={{
            width: 80,
            height: 80,
            background: running
              ? `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.3) 0%, ${current.color} 60%, transparent 100%)`
              : "var(--bg-glass)",
            border: running ? `1px solid ${current.color}40` : "0.5px solid var(--card-border)",
            boxShadow: running ? `0 0 40px -8px ${current.color}40` : "none",
          }}
          animate={
            running
              ? { scale: current.scale }
              : { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }
          }
          transition={{
            duration: running ? current.seconds : 4,
            ease: "easeInOut",
            repeat: running ? 0 : Infinity,
          }}
        />
      </div>

      {/* 阶段指示 */}
      {running ? (
        <div className="text-center mb-4">
          <p className="text-2xl font-light tracking-widest" style={{ color: "var(--text-primary)" }}>
            {current.label}
          </p>
          <p className="text-5xl font-thin mt-2" style={{ color: current.color }}>
            {countdown}
          </p>
        </div>
      ) : (
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          按开始跟随引导
        </p>
      )}

      {/* 进度条 */}
      {running && (
        <div className="w-48 h-1 rounded-full mb-4 overflow-hidden" style={{ background: "var(--bg-glass)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${CYCLES[0].color}, ${CYCLES[2].color})` }}
            animate={{ width: `${((cycleIdx * 10 + countdown) / 19) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* 轮次 */}
      {running && (
        <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
          第 {rounds + 1} 轮
        </p>
      )}

      {/* 按钮 */}
      <button
        onClick={running ? stop : start}
        className="btn-luminous px-10 py-3"
      >
        {running ? "结束" : "开始呼吸练习"}
      </button>

      {/* 呼吸法说明 */}
      <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-xs text-center">
        {CYCLES.map((c) => (
          <div key={c.phase} className="flex flex-col items-center">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.label}</span>
            <span className="text-lg font-light" style={{ color: "var(--text-primary)" }}>{c.seconds}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}
