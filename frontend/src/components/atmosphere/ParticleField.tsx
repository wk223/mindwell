import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
  phase: number;
  twinkleSpeed: number;
}

interface Layer {
  count: number;
  maxSize: number;
  baseSpeed: number;
  opacityRange: [number, number];
  glowMult: number; // 光晕倍数
}

const LAYERS: Layer[] = [
  // 第1层：细微背景粒子
  { count: 40, maxSize: 1.2, baseSpeed: 0.08, opacityRange: [0.15, 0.4], glowMult: 2 },
  // 第2层：中小光点
  { count: 20, maxSize: 2.0, baseSpeed: 0.05, opacityRange: [0.25, 0.6], glowMult: 2.5 },
  // 第3层：较大发光
  { count: 8, maxSize: 3.5, baseSpeed: 0.03, opacityRange: [0.3, 0.7], glowMult: 3 },
  // 第4层：大粒子 — 极慢，强发光，营造深空感
  { count: 5, maxSize: 6.0, baseSpeed: 0.012, opacityRange: [0.35, 0.75], glowMult: 4 },
];

/** 从 CSS 变量读取粒子颜色 */
function getParticleColor(): [number, number, number] {
  try {
    const style = getComputedStyle(document.documentElement);
    const val = style.getPropertyValue("--particle-color").trim();
    // 解析 rgba(r, g, b, ...)
    const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
  } catch { /* fallback */ }
  return [139, 92, 246]; // 默认冷紫
}

/** 从 CSS 变量读取情绪倍率 */
function getMoodMultiplier(): number {
  try {
    const root = document.documentElement;
    if (root.classList.contains("mood-anxious")) return 0.4;
    if (root.classList.contains("mood-happy")) return 1.3;
    return 1.0;
  } catch { return 1.0; }
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const colorCache = useRef<[number, number, number]>([139, 92, 246]);
  const moodCache = useRef(1.0);
  const frameRef = useRef(0);

  const initParticles = useCallback((width: number, height: number) => {
    particlesRef.current = LAYERS.map((layer) =>
      Array.from({ length: layer.count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * layer.maxSize + 0.3,
        speedX: (Math.random() - 0.5) * layer.baseSpeed,
        speedY: (Math.random() - 0.5) * layer.baseSpeed - layer.baseSpeed * 0.3,
        opacity: 0,
        baseOpacity:
          Math.random() * (layer.opacityRange[1] - layer.opacityRange[0]) +
          layer.opacityRange[0],
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.003 + Math.random() * 0.008,
      }))
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    let rafId: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles(window.innerWidth, window.innerHeight);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const draw = () => {
      if (!running) return;
      frameRef.current++;

      // 每 60 帧刷新一次 CSS 变量（减少 DOM 读取）
      if (frameRef.current % 60 === 0) {
        colorCache.current = getParticleColor();
        moodCache.current = getMoodMultiplier();
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const { x: mx, y: my } = mouseRef.current;
      const [cr, cg, cb] = colorCache.current;
      const moodMult = moodCache.current;

      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((layer, li) => {
        const layerConfig = LAYERS[li];
        layer.forEach((p) => {
          // Twinkling opacity
          p.phase += p.twinkleSpeed;
          const base = p.baseOpacity * moodMult;
          p.opacity = Math.min(base * (0.6 + 0.4 * Math.sin(p.phase)), 0.9);

          // Slow float upward with mouse parallax
          const parallaxX = (mx - 0.5) * (li + 1) * 0.6;
          p.x += p.speedX + parallaxX * 0.02;
          p.y += p.speedY;

          // Wrap around
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.y > h + 10) p.y = -10;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          // Draw
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size * layerConfig.glowMult
          );
          gradient.addColorStop(0, `rgba(${cr},${cg},${cb},${p.opacity})`);
          gradient.addColorStop(0.3, `rgba(${cr},${cg},${cb},${p.opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

          ctx.fillStyle = gradient;
          ctx.fill();
        });
      });

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.65 }}
    />
  );
}
