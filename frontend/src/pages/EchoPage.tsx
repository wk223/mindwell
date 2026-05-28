import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const modes = [
  { key: "gentle", label: "温柔", emoji: "🕊️" },
  { key: "clear", label: "清醒", emoji: "💎" },
  { key: "philosophy", label: "哲学", emoji: "🪐" },
  { key: "late", label: "深夜", emoji: "🌙" },
  { key: "hope", label: "希望", emoji: "✨" },
];

export default function EchoPage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("gentle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleAsk = () => {
    if (!question.trim()) return;
    setIsRevealing(true);
    setAnswer(null);

    // Simulate answer reveal
    setTimeout(() => {
      const answers = [
        "跟随你内心的声音，它知道方向。",
        "答案早已在你心中，你只是需要勇气去确认。",
        "风会带走疑问，留下的只有你真实的选择。",
        "不必急于知道一切，有些路需要慢慢走。",
        "宇宙没有巧合，每一次相遇都是回应。",
      ];
      setAnswer(answers[Math.floor(Math.random() * answers.length)]);
    }, 1200);
  };

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-16 relative"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #071426 40%, #0F172A 70%, #1E293B 100%)",
      }}
    >
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, rgba(200,180,220,1) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.02]"
        style={{ background: "radial-gradient(circle, rgba(201,141,50,1) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-5"
          >
            📖
          </motion.div>
          <h1 className="font-serif text-3xl font-semibold text-slate-100 tracking-tight">
            ECHO 答案之书
          </h1>
          <p className="text-slate-500 mt-3 text-sm leading-relaxed max-w-sm mx-auto">
            在心里默念你的问题，然后翻开这一页
          </p>
        </motion.div>

        {/* Question input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: easeOut }}
          className="mb-8"
        >
          <div
            className="relative rounded-3xl p-8 border border-white/[0.08] bg-white/[0.03]"
            style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            {/* Glow edge */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.04] pointer-events-none" />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-moon-400/20 to-transparent"
            />

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="写下你想问的问题..."
              rows={3}
              className="w-full resize-none bg-transparent text-center text-lg text-slate-200
                         placeholder:text-slate-600 focus:outline-none
                         leading-relaxed"
            />

            {/* Mode buttons */}
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {modes.map((m) => (
                <motion.button
                  key={m.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(m.key)}
                  className="relative px-4 py-2 rounded-full text-sm transition-all duration-300"
                  style={
                    mode === m.key
                      ? {
                          background: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          boxShadow: "0 0 24px -8px rgba(200,180,220,0.3)",
                        }
                      : {
                          background: "transparent",
                          color: "#64748b",
                        }
                  }
                >
                  {mode === m.key && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-lavender-400/10 to-moon-400/10" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAsk}
            disabled={!question.trim() || isRevealing}
            className="btn-glow text-base px-12 py-4 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isRevealing ? "..." : "翻开这一页"}
          </motion.button>
        </motion.div>

        {/* Answer reveal */}
        <AnimatePresence>
          {isRevealing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              {/* Darkening overlay effect via a subtle backdrop */}
              {!answer ? (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl"
                >
                  🌌
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-heavy rounded-3xl p-10 card-texture max-w-xl mx-auto"
                >
                  {/* Glow pulse on reveal */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-3xl bg-lavender-400/5 pointer-events-none"
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="font-serif text-xl text-slate-200 leading-relaxed italic"
                  >
                    "{answer}"
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                    onClick={() => {
                      setIsRevealing(false);
                      setAnswer(null);
                      setQuestion("");
                    }}
                    className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    再问一次
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
