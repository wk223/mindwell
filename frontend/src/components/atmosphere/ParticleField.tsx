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
}

const LAYERS: Layer[] = [
  { count: 40, maxSize: 1.2, baseSpeed: 0.08, opacityRange: [0.15, 0.4] },
  { count: 20, maxSize: 2.0, baseSpeed: 0.05, opacityRange: [0.25, 0.6] },
  { count: 8, maxSize: 3.5, baseSpeed: 0.03, opacityRange: [0.3, 0.7] },
];

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
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

      const w = window.innerWidth;
      const h = window.innerHeight;
      const { x: mx, y: my } = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((layer, li) => {
        layer.forEach((p) => {
          // Twinkling opacity
          p.phase += p.twinkleSpeed;
          p.opacity = p.baseOpacity * (0.6 + 0.4 * Math.sin(p.phase));

          // Slow float upward with slight mouse parallax
          const parallaxX = (mx - 0.5) * (li + 1) * 0.6;
          p.x += p.speedX + parallaxX * 0.02;
          p.y += p.speedY;

          // Wrap around
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.y > h + 10) p.y = -10;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          // Draw
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          // Radial gradient for soft glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          gradient.addColorStop(0, `rgba(220,210,240,${p.opacity})`);
          gradient.addColorStop(0.3, `rgba(200,180,220,${p.opacity * 0.5})`);
          gradient.addColorStop(1, "rgba(200,180,220,0)");

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
      style={{ opacity: 0.7 }}
    />
  );
}
