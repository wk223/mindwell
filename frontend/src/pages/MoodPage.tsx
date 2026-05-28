import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const moods = [
  { key: "calm", label: "平静", emoji: "😌", color: "from-lavender-400/40 to-lavender-500/20" },
  { key: "happy", label: "开心", emoji: "😊", color: "from-moon-400/40 to-moon-500/20" },
  { key: "melancholy", label: "忧郁", emoji: "🌧️", color: "from-slate-400/30 to-slate-500/20" },
  { key: "anxious", label: "焦虑", emoji: "😰", color: "from-rose-400/30 to-rose-500/20" },
  { key: "grateful", label: "感恩", emoji: "💝", color: "from-rose-300/30 to-moon-400/20" },
  { key: "hopeful", label: "期待", emoji: "🌅", color: "from-moon-400/30 to-lavender-400/20" },
  { key: "tired", label: "疲惫", emoji: "😴", color: "from-slate-400/25 to-slate-500/15" },
  { key: "energetic", label: "活力", emoji: "⚡", color: "from-moon-500/30 to-moon-400/20" },
];

export default function MoodPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!selectedMood && !note.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="mb-10"
      >
        <h1 className="font-serif text-2xl font-medium text-slate-200 tracking-tight">
          情绪日记
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          记录此刻的心情，每一个感受都值得被看见
        </p>
      </motion.div>

      {/* Floating emotion balls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-12"
      >
        {moods.map((m, i) => (
          <motion.button
            key={m.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedMood(selectedMood === m.key ? null : m.key)}
            className="relative flex flex-col items-center gap-1.5 select-none"
          >
            {/* Glow ring when selected */}
            <AnimatePresence>
              {selectedMood === m.key && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${m.color} blur-xl`}
                />
              )}
            </AnimatePresence>
            <div
              className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl
                          transition-all duration-300 border
                          ${
                            selectedMood === m.key
                              ? "bg-white/[0.08] border-white/[0.12] shadow-glow-sm"
                              : "bg-white/[0.03] border-white/[0.04]"
                          }`}
              style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            >
              {m.emoji}
            </div>
            <span
              className={`text-[11px] transition-colors duration-300 ${
                selectedMood === m.key ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {m.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Note input — "letter to self" */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: easeOut }}
        className="mb-8"
      >
        <div
          className="relative rounded-3xl p-8 border border-white/[0.06] bg-white/[0.02]"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          {/* Paper texture overlay */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none opacity-[0.015]"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,0.3) 31px, rgba(255,255,255,0.3) 32px)",
            }}
          />
          {/* Warm amber light */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-moon-400/[0.03] blur-3xl pointer-events-none" />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天有什么留在心里吗？"
            rows={6}
            className="relative z-10 w-full resize-none bg-transparent text-slate-300
                       placeholder:text-slate-600 focus:outline-none
                       leading-relaxed text-base"
          />
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-center"
      >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.p
              key="saved"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-slate-400"
            >
              已记录 ✨
            </motion.p>
          ) : (
            <motion.button
              key="save"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              className="btn-glow px-10 py-3.5"
            >
              记录下来
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
