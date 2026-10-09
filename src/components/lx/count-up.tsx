"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Number that counts up the first time it scrolls into view. The server render and the
 * reduced-motion case show the final value, so nothing depends on the animation.
 */
export function CountUp({
  to,
  duration = 1400,
  className = "",
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          setN(Math.round(to * (1 - (1 - p) ** 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        setN(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref} className={`num ${className}`}>
      {n.toLocaleString("en-NG")}
    </span>
  );
}
