import { motion } from "framer-motion";

const easeOut = [0.25, 0.1, 0.25, 1] as const;
const easeSpring = [0.34, 1.56, 0.64, 1] as const;

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

export default function RightPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: easeOut, delay: 0.3 }}
      className="w-[260px] shrink-0 flex flex-col h-full relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-void-900/70" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

      <div className="relative z-10 flex flex-col h-full px-5 py-7 overflow-y-auto">
        <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
          {/* Today's mood */}
          <motion.section variants={itemAnim} className="glass rounded-2xl p-4 card-texture">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">今日心情</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl animate-breathe">
                🌙
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">平静</p>
                <p className="text-xs text-slate-500 mt-0.5">比昨天更放松</p>
              </div>
            </div>
          </motion.section>

          {/* Mood trend */}
          <motion.section variants={itemAnim} className="glass rounded-2xl p-4 card-texture">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">近期情绪</p>
            <div className="flex items-end gap-1.5 h-16">
              {[0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.8].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex-1 rounded-full bg-gradient-to-t from-moon-500/40 to-lavender-400/40 origin-bottom"
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-600">
              <span>周一</span>
              <span>周日</span>
            </div>
          </motion.section>

          {/* Daily quote */}
          <motion.section variants={itemAnim} className="glass rounded-2xl p-4 card-texture">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">每日语录</p>
            <p className="text-sm text-slate-300 leading-relaxed font-serif italic">
              "你不需要总是坚强，偶尔柔软也是一种力量。"
            </p>
          </motion.section>

          {/* Quick actions */}
          <motion.section variants={itemAnim} className="glass rounded-2xl p-4 card-texture">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">快捷入口</p>
            <div className="space-y-2">
              {[
                { label: "开始倾诉", emoji: "💭" },
                { label: "ECHO 答案之书", emoji: "📖" },
                { label: "呼吸练习", emoji: "🧘" },
              ].map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400
                             hover:text-slate-200 transition-colors duration-300 text-left"
                >
                  <span className="text-base">{action.emoji}</span>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* AI companion status */}
          <motion.section variants={itemAnim} className="glass rounded-2xl p-4 card-texture">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">AI 陪伴状态</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success-500 animate-ping opacity-30" />
              </div>
              <div>
                <p className="text-sm text-slate-300">在线陪伴中</p>
                <p className="text-xs text-slate-600 mt-0.5">随时可以倾听</p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </motion.aside>
  );
}
