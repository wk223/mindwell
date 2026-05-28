import { useState, useRef, useEffect, useCallback } from "react";

const LS_KEY_PLAYING = "mindwell_bgm_playing";

export default function VinylPlayer() {
  const [playing, setPlaying] = useState(() => {
    localStorage.removeItem("mindwell_bgm_hidden");
    const v = localStorage.getItem(LS_KEY_PLAYING);
    return v === null ? true : v === "true";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("mindwell_bgm_pos");
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === "number" && typeof p.y === "number") return p;
      }
    } catch { /* ignore */ }
    return null;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/bgm.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    const a = audioRef.current;
    if (playing) {
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
    return () => { a.pause(); };
  }, [playing]);

  useEffect(() => { localStorage.setItem(LS_KEY_PLAYING, String(playing)); }, [playing]);
  useEffect(() => { if (pos) localStorage.setItem("mindwell_bgm_pos", JSON.stringify(pos)); }, [pos]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos?.x ?? 0, posY: pos?.y ?? 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const togglePlay = () => {
    if (!dragging.current) setPlaying((p) => !p);
  };

  const style: React.CSSProperties = pos
    ? { position: "fixed", left: pos.x, top: pos.y, zIndex: 9999 }
    : { position: "fixed", right: 24, bottom: 24, zIndex: 9999 };

  if (collapsed) {
    return (
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={style}
        className="select-none touch-none"
      >
        <button
          onClick={() => setCollapsed(false)}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg border border-stone-200
                     flex items-center justify-center text-lg hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing"
          title="展开唱片机"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={style}
      className="select-none touch-none flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing"
    >
      {/* Turntable body */}
      <div className="relative w-[100px] h-[110px]">
        {/* Plinth background */}
        <div className="absolute inset-0 rounded-3xl bg-stone-800/80 backdrop-blur shadow-2xl border border-white/5" />

        {/* Vinyl record */}
        <button
          onClick={togglePlay}
          className="absolute left-1/2 -translate-x-1/2 bottom-[10px] w-[76px] h-[76px] rounded-full cursor-pointer focus:outline-none"
          style={{
            boxShadow: playing
              ? "0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(245,158,11,0.1)"
              : "0 2px 12px rgba(0,0,0,0.3)",
            transition: "box-shadow 0.7s ease",
          }}
          title={playing ? "暂停" : "播放"}
        >
          {/* Record surface */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, #1e1e1e 0%, #111 30%, #1a1a1a 32%, #0a0a0a 50%, #111 52%, #0d0d0d 100%)",
              animation: playing ? "vinyl-spin 3s linear infinite" : "none",
            }}
          >
            {[7, 12, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68].map((r, i) => (
              <div
                key={r}
                className="absolute rounded-full border border-white/[0.02]"
                style={{
                  inset: `${(76 - r * 2) / 2}px`,
                  opacity: i % 3 === 0 ? 0.05 : 0.025,
                }}
              />
            ))}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.02) 100%)",
              }}
            />
          </div>
          {/* Center label */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #d4a574 0%, #b8860b 40%, #92400e 100%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            <div className="w-[5px] h-[5px] rounded-full bg-stone-900 shadow-inner" />
          </div>
        </button>

        {/* Tonearm assembly — on top of record */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          {/* Pivot base */}
          <div
            className="absolute w-[11px] h-[11px] rounded-full bg-stone-500 shadow-inner"
            style={{ right: "16px", top: "8px" }}
          />
          {/* Arm rest post */}
          <div
            className="absolute w-[5px] h-[8px] rounded-full bg-stone-600"
            style={{ right: "10px", top: "14px" }}
          />

          {/* Tonearm */}
          <div
            className="absolute h-[65px] w-[3px] rounded-full transition-all duration-700 ease-out"
            style={{
              right: "20px",
              top: "12px",
              background: "linear-gradient(180deg, #b0aca8 0%, #8b8680 40%, #6b6560 100%)",
              transformOrigin: "top center",
              transform: playing ? "rotate(-38deg)" : "rotate(12deg)",
              boxShadow: "1px 0 3px rgba(0,0,0,0.2)",
            }}
          >
            {/* Headshell + needle */}
            <div
              className="absolute -bottom-[3px] -left-[7px] w-[17px] h-[5px] rounded-full"
              style={{
                background: "linear-gradient(90deg, #9ca3af, #6b7280)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            />
            {/* Needle tip */}
            <div
              className="absolute -bottom-[4px] left-[3px] w-[2px] h-[4px]"
              style={{
                background: "linear-gradient(180deg, #d4d4d8, #a1a1aa)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-white/80 backdrop-blur border border-stone-200 flex items-center justify-center
                     text-[11px] hover:bg-white transition-colors shadow-sm"
          title={playing ? "暂停" : "播放"}
        >
          {playing ? (
            <svg className="w-3 h-3" viewBox="0 0 8 10"><path d="M0 0h3v10H0z" fill="currentColor"/><path d="M5 0h3v10H5z" fill="currentColor"/></svg>
          ) : (
            <svg className="w-3 h-3 ml-[1px]" viewBox="0 0 8 10"><path d="M0 0l8 5-8 5z" fill="currentColor"/></svg>
          )}
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded-full bg-white/60 backdrop-blur border border-stone-200 flex items-center justify-center
                     text-[9px] text-stone-400 hover:text-stone-600 transition-colors"
          title="收起"
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 2"><path d="M1 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
