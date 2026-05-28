import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  phase: number;
  speed: number;
  wobbleAmp: number;
}

export default function FireflyParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    const count = 28;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        wobbleAmp: 8 + Math.random() * 20,
      });
    }

    let animId: number;
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = time * 0.001;

      for (const p of particles) {
        p.y = p.baseY - Math.sin(t * p.speed + p.phase) * 10;
        p.x = p.baseX + Math.cos(t * p.speed * 0.7 + p.phase) * p.wobbleAmp;
        const blink = 0.5 + 0.5 * Math.sin(t * 2 + p.phase * 3);
        const alpha = p.opacity * blink;

        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(253,224,71,${alpha})`);
        gradient.addColorStop(0.4, `rgba(251,191,36,${alpha * 0.5})`);
        gradient.addColorStop(1, "rgba(251,191,36,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,200,${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
