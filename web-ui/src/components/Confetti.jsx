import { useEffect, useRef } from "react";

export default function Confetti({ declenche }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!declenche) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const particules = Array.from({ length: 90 }, () => ({
      x: Math.random() * w,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 6,
      r: 4 + Math.random() * 4,
      c: ["#10B27E", "#000000", "#FFFFFF", "#6EE7B7"][Math.floor(Math.random() * 4)],
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      particules.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.r, p.r * 0.6);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => cancelAnimationFrame(raf), 2200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [declenche]);
  if (!declenche) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50" aria-hidden />;
}
