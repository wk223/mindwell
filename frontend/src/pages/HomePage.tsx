import { motion } from "framer-motion";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10 pb-20">
      {/* ── Hero Emotion Card ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: easeOut }}
        className="relative overflow-hidden rounded-3xl mb-12"
      >
        {/* Deep night background */}
        <div className="absolute inset-0 bg-gradient-to-br from-void-900 via-void-850 to-void-800" />

        {/* Moonlight glow */}
        <div
          className="absolute -top-40 right-20 w-96 h-96 rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, rgba(200,180,220,1) 0%, transparent 70%)",
          }}
        />

        {/* Floating stars (CSS) */}
        {[
          { top: "12%", left: "65%", size: "2px", delay: "0s" },
          { top: "25%", left: "72%", size: "1.5px", delay: "2s" },
          { top: "40%", left: "58%", size: "2.5px", delay: "4s" },
          { top: "55%", left: "80%", size: "1px", delay: "1s" },
          { top: "18%", left: "48%", size: "1.8px", delay: "3s" },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 p-10 lg:p-14">
          {/* Left text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
              className="font-serif text-3xl lg:text-4xl font-semibold text-slate-100 leading-tight tracking-tight text-balance"
            >
              倾听你的心声
              <br />
              陪伴你的每一段旅程
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: easeOut }}
              className="mt-4 text-slate-400 text-base leading-relaxed max-w-md"
            >
              在这里，你可以安心倾诉，遇见更好的自己
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: easeOut }}
              className="mt-8"
            >
              <button className="btn-glow text-base px-10 py-3.5">
                开始倾诉
              </button>
            </motion.div>
          </div>

          {/* Right illustration area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: easeOut }}
            className="relative flex-shrink-0 w-64 h-64 lg:w-72 lg:h-72"
          >
            {/* Moon */}
            <div className="absolute top-6 right-10 w-16 h-16 rounded-full bg-gradient-to-br from-slate-100/80 to-slate-300/40 shadow-moon animate-breathe" />
            {/* Moon glow ring */}
            <div
              className="absolute top-2 right-6 w-24 h-24 rounded-full animate-breathe-slow"
              style={{
                background: "radial-gradient(circle, rgba(200,180,220,0.15) 0%, transparent 60%)",
              }}
            />
            {/* Glass jar */}
            <div className="absolute bottom-6 left-8 w-20 h-24 rounded-2xl border border-white/[0.08] bg-white/[0.03] animate-float"
              style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              {/* Heart inside jar */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xl"
              >
                💛
              </motion.div>
            </div>
            {/* Floating hearts */}
            {[
              { top: "20%", left: "30%", delay: "0s" },
              { top: "10%", left: "55%", delay: "2s" },
              { top: "50%", left: "70%", delay: "4s" },
            ].map((h, i) => (
              <div
                key={i}
                className="absolute text-sm opacity-30 animate-float"
                style={{ top: h.top, left: h.left, animationDelay: h.delay }}
              >
                ✨
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom shimmer */}
        <div className="relative h-px z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
        </div>
      </motion.section>

      {/* ── Three-tier card system ── */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {/* Tier 1 — Primary card: AI 倾诉 */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 glass-heavy rounded-3xl p-7 card-texture relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-lavender-400/[0.04] blur-3xl group-hover:bg-lavender-400/[0.06] transition-colors duration-700" />
          <div className="relative z-10">
            <span className="text-2xl mb-3 block">💭</span>
            <h3 className="font-serif text-lg font-medium text-slate-200 mb-2">AI 倾诉</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              随时陪伴，用心倾听你的每一个故事和情绪
            </p>
          </div>
        </motion.div>

        {/* Tier 1 — Primary card: ECHO 答案之书 */}
        <motion.div
          variants={fadeUp}
          className="glass-heavy rounded-3xl p-7 card-texture relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-moon-400/[0.04] blur-3xl group-hover:bg-moon-400/[0.06] transition-colors duration-700" />
          <div className="relative z-10">
            <span className="text-2xl mb-3 block">📖</span>
            <h3 className="font-serif text-lg font-medium text-slate-200 mb-2">ECHO 答案之书</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              翻开这一页，让宇宙回应你的问题
            </p>
          </div>
        </motion.div>

        {/* Tier 2 cards */}
        {[
          { emoji: "📝", title: "情绪日记", desc: "记录每天的心情变化，理解自己的情绪轨迹" },
          { emoji: "🧘", title: "自助成长", desc: "呼吸练习、冥想引导、正向思维训练" },
          { emoji: "🧩", title: "心理测评", desc: "科学的心理量表，了解自己的心理状态" },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="glass rounded-3xl p-6 card-texture relative overflow-hidden group cursor-pointer hover:bg-white/[0.06] transition-colors duration-500"
          >
            <div className="relative z-10">
              <span className="text-xl mb-3 block">{card.emoji}</span>
              <h3 className="font-serif text-base font-medium text-slate-300 mb-1.5">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          </motion.div>
        ))}

        {/* Tier 3 — lighter cards */}
        {[
          { emoji: "🌿", label: "焦虑缓解" },
          { emoji: "💤", label: "睡眠改善" },
          { emoji: "🌈", label: "积极心态" },
          { emoji: "🎯", label: "自我认知" },
          { emoji: "💪", label: "情绪恢复力" },
          { emoji: "🫂", label: "人际关系" },
        ].map((tag, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="glass-light rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.05] transition-colors duration-300"
          >
            <span className="text-sm">{tag.emoji}</span>
            <span className="text-xs text-slate-500">{tag.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
