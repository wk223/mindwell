import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UniverseCanvas from "../components/universe/UniverseCanvas";
import { useUniverseStore } from "../stores/useUniverseStore";

export default function UniversePage() {
  const selectedPlanetId = useUniverseStore((s) => s.selectedPlanetId);
  const planets = useUniverseStore((s) => s.planets);
  const loadPlanets = useUniverseStore((s) => s.loadPlanets);
  const selectPlanet = useUniverseStore((s) => s.selectPlanet);

  useEffect(() => {
    loadPlanets();
  }, [loadPlanets]);

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 3D 场景 */}
      <UniverseCanvas />

      {/* 顶部信息 */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-6">
        <h1 className="font-serif text-2xl font-medium tracking-tight"
          style={{ color: "var(--text-primary)" }}>
          情绪宇宙
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {planets.length} 颗星球 · 属于你的情绪星系
        </p>
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          拖拽旋转 · 滚轮缩放 · 点击星球查看
        </p>
      </div>

      {/* 星球详情浮层 */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
          >
            <div
              className="glass-heavy rounded-2xl px-6 py-5 max-w-sm text-center"
              style={{ backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}
            >
              {/* 星球颜色 + 类型 */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: selectedPlanet.color, boxShadow: `0 0 8px ${selectedPlanet.color}` }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {selectedPlanet.sourceLabel}
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  · {selectedPlanet.sourceDate}
                </span>
              </div>
              {/* 内容预览 */}
              {selectedPlanet.previewText && (
                <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
                  "{selectedPlanet.previewText}"
                </p>
              )}
              {selectedPlanet.moodScore && (
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                  心情 {selectedPlanet.moodScore}/10
                </p>
              )}
              {/* 关闭按钮 */}
              <button
                onClick={() => selectPlanet(null)}
                className="mt-3 text-xs transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                点击空白处关闭
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
