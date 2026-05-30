/** 雾气特效 — 底部渐变雾层，慢速漂移 */
export default function FogOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
      {/* 底部浓雾 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%]"
        style={{
          background: "linear-gradient(0deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.06) 40%, transparent 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "fog-drift 20s ease-in-out infinite",
        }}
      />
      {/* 中层薄雾 */}
      <div
        className="absolute bottom-[10%] left-0 right-0 h-[25%]"
        style={{
          background: "linear-gradient(0deg, rgba(59,130,246,0.06) 0%, transparent 100%)",
          animation: "fog-drift 28s ease-in-out 5s infinite reverse",
        }}
      />
    </div>
  );
}
