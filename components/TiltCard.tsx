"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, TouchEvent as ReactTouchEvent } from "react";

export default function TiltCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);

  const reset = () => {
    pressed.current = false;
    const el = ref.current;
    const glare = glareRef.current;
    if (!el || !glare) return;
    el.style.transition =
      "transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)";
    el.style.transform =
      "perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    el.style.boxShadow = "none";
    glare.style.opacity = "0";
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Never tilt touch/pen input. Mobile browsers may synthesize mouse events
    // after a tap, which used to leave cards permanently skewed.
    if (e.pointerType !== "mouse") return;

    const el = ref.current;
    const glare = glareRef.current;
    if (!el || !glare) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 14;
    const scale = pressed.current ? 1.0 : 1.04;

    el.style.transition = "none";
    el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    el.style.boxShadow =
      "0 20px 45px rgba(0,0,0,0.35), 0 0 30px rgba(201,162,39,0.1)";
    glare.style.opacity = "1";
    glare.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.18), transparent 55%)`;
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    pressed.current = true;
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform var(--duration-fast) var(--ease-out)";
    el.style.transform = "perspective(700px) scale3d(0.98, 0.98, 0.98)";
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") {
      reset();
      return;
    }
    pressed.current = false;
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform var(--duration-fast) var(--ease-out)";
  };

  const handleTouchEnd = (_e: ReactTouchEvent<HTMLDivElement>) => reset();

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={reset}
      onPointerLeave={reset}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={className}
      style={{ transformStyle: "preserve-3d", touchAction: "pan-y", ...style }}
    >
      {children}
      <div
        ref={glareRef}
        className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
        style={{ opacity: 0 }}
        aria-hidden
      />
    </div>
  );
}
