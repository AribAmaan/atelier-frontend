"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Wraps any content in a real (perspective-based) 3D tilt that follows the
 * cursor, plus a soft light-glare that tracks the pointer — the same trick
 * behind most "premium" product cards. Falls back to a flat, static card on
 * touch devices (no mousemove there) and respects prefers-reduced-motion via
 * the transition being cheap enough to no-op under the global media query.
 */
export default function Tilt3D({
  children,
  className = "",
  style,
  maxTilt = 12,
  glare = true,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  glare?: boolean;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  );
  const [glareStyle, setGlareStyle] = useState<CSSProperties>({ opacity: 0 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - py) * maxTilt * 2;
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
    );
    if (glare) {
      setGlareStyle({
        opacity: 1,
        background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.16), transparent 55%)`,
      });
    }
  }

  function handleLeave() {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlareStyle({ opacity: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt-3d ${className}`}
      style={{ transform, ...style }}
    >
      {children}
      {glare && <div className="tilt-3d-glare" style={glareStyle} aria-hidden />}
    </div>
  );
}
