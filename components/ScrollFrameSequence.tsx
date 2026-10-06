"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Props = {
  frameCount?: number;
  framePath?: string;
  className?: string;
  scrollHeight?: string;
};

function getFrameIndices(frameCount: number, mobile: boolean, reducedMotion: boolean) {
  if (reducedMotion) return [1];
  if (!mobile) {
    // Loading every frame up front creates unnecessary decode pressure and
    // competes with the rest of the landing page for bandwidth/CPU.
    // Two-frame sampling keeps the scroll reveal smooth via nearest-frame
    // fallback while halving image requests and memory usage.
    const indices = new Set<number>();
    for (let i = 1; i <= frameCount; i += 2) indices.add(i);
    indices.add(frameCount);
    return [...indices].sort((a, b) => a - b);
  }

  const indices = new Set<number>();
  for (let i = 1; i <= frameCount; i += 2) indices.add(i);
  indices.add(frameCount);
  return [...indices].sort((a, b) => a - b);
}

const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  left: `${7 + ((i * 29) % 86)}%`,
  top: `${8 + ((i * 53) % 78)}%`,
  size: `${1 + (i % 3) * 0.55}px`,
  delay: `${-(i * 0.41)}s`,
  duration: `${6.5 + (i % 5) * 1.25}s`,
  drift: `${(i % 2 ? 1 : -1) * (5 + (i % 6) * 2)}px`,
  opacity: `${0.12 + (i % 5) * 0.055}`,
}));

export default function ScrollFrameSequence({
  frameCount = 120,
  framePath = "/frames-crisp/ezgif-frame-",
  className = "",
  scrollHeight = "440vh",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressDotRef = useRef<HTMLSpanElement>(null);
  const framesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const drawRafRef = useRef<number | null>(null);
  const motionRafRef = useRef<number | null>(null);
  const targetFrameRef = useRef(1);
  const paintedFrameRef = useRef(0);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  // Lazily read the real values on first client render instead of always
  // starting at `false` and correcting a moment later in an effect. That
  // correction used to fire *after* the frame-loading effect below had
  // already kicked off a full "desktop" load (all 120 frames, concurrency
  // 8) — which then got thrown away and restarted with the right mobile
  // settings a tick later. On phones that meant briefly fetching frames
  // that were never going to be used, and delayed frame 1 (the one thing
  // visible on load) behind a wasted restart.
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateViewport = () => setMobile(window.innerWidth < 768);
    media.addEventListener?.("change", updateMotion);
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => {
      media.removeEventListener?.("change", updateMotion);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const frameIndices = useMemo(
    () => getFrameIndices(frameCount, mobile, reducedMotion),
    [frameCount, mobile, reducedMotion],
  );

  useEffect(() => {
    let cancelled = false;
    const frames = framesRef.current;
    frames.clear();
    setLoaded(0);
    setReady(false);
    paintedFrameRef.current = 0;
    targetFrameRef.current = 1;

    // Load the first and final frame first, then fill the sequence in order.
    const orderedIndices = [
      ...new Set([frameIndices[0], frameIndices[frameIndices.length - 1], ...frameIndices]),
    ];

    const concurrency = reducedMotion ? 1 : mobile ? 4 : 8;
    let cursor = 0;
    let completed = 0;

    const loadOne = (index: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        // Frame 1 is the only frame visible the instant the page loads (before
        // any scrolling) — pin it to high fetch priority so the browser's
        // network stack serves its bytes ahead of the other ~60-120 frames
        // that are all requested around the same time.
        img.fetchPriority = index === 1 ? "high" : "low";
        img.onload = async () => {
          if (cancelled) return resolve();
          try {
            await img.decode();
          } catch {
            // The browser can still draw a successfully loaded image.
          }
          if (!cancelled) {
            frames.set(index, img);
            completed += 1;
            setLoaded(completed);
            if (index === 1) setReady(true);
          }
          resolve();
        };
        img.onerror = () => {
          completed += 1;
          if (!cancelled) setLoaded(completed);
          resolve();
        };
        img.src = `${framePath}${String(index).padStart(3, "0")}.webp`;
      });

    const worker = async () => {
      while (!cancelled) {
        const index = orderedIndices[cursor++];
        if (!index) return;
        await loadOne(index);
      }
    };

    void Promise.all(
      Array.from({ length: Math.min(concurrency, orderedIndices.length) }, worker),
    );

    return () => {
      cancelled = true;
    };
  }, [frameCount, framePath, frameIndices, mobile, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!canvas || !section || !stage || !ready) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

    const resizeCanvas = () => {
      const cssWidth = Math.max(1, canvas.clientWidth);
      const cssHeight = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const backingWidth = Math.round(cssWidth * dpr);
      const backingHeight = Math.round(cssHeight * dpr);

      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      return { cssWidth, cssHeight, dpr };
    };

    const findNearestLoaded = (index: number) => {
      const frames = framesRef.current;
      if (frames.size === 0) return null;
      if (frames.has(index)) return frames.get(index)!;

      let nearest: HTMLImageElement | null = null;
      let distance = Number.POSITIVE_INFINITY;
      for (const [key, image] of frames) {
        const nextDistance = Math.abs(key - index);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = image;
        }
      }
      return nearest;
    };

    const draw = (requestedIndex: number) => {
      const frame = findNearestLoaded(requestedIndex);
      if (!frame) return;
      const { cssWidth, cssHeight, dpr } = resizeCanvas();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      // The source artwork is a complete 16:9 scene. On wide desktop
      // viewports, cropping it with "cover" cuts off the character's head
      // and feet. Fit the scene instead and bias it slightly to the right so
      // the editorial copy owns the left side of the composition.
      const imageAspect = frame.naturalWidth / frame.naturalHeight;
      const canvasAspect = cssWidth / cssHeight;
      const isWideDesktop = canvasAspect >= 1.45 && window.innerWidth >= 900;

      if (isWideDesktop) {
        const fitScale = Math.min(cssWidth / frame.naturalWidth, cssHeight / frame.naturalHeight);
        const drawWidth = frame.naturalWidth * fitScale;
        const drawHeight = frame.naturalHeight * fitScale;
        const spareX = cssWidth - drawWidth;
        const drawX = spareX * 0.78;
        const drawY = (cssHeight - drawHeight) * 0.5;
        ctx.drawImage(frame, 0, 0, frame.naturalWidth, frame.naturalHeight, drawX, drawY, drawWidth, drawHeight);
      } else {
        let sx = 0;
        let sy = 0;
        let sWidth = frame.naturalWidth;
        let sHeight = frame.naturalHeight;

        if (imageAspect > canvasAspect) {
          sWidth = frame.naturalHeight * canvasAspect;
          sx = (frame.naturalWidth - sWidth) * 0.42;
        } else if (imageAspect < canvasAspect) {
          sHeight = frame.naturalWidth / canvasAspect;
          sy = (frame.naturalHeight - sHeight) * 0.5;
        }

        ctx.drawImage(frame, sx, sy, sWidth, sHeight, 0, 0, cssWidth, cssHeight);
      }

      paintedFrameRef.current = requestedIndex;
    };

    const paint = () => {
      drawRafRef.current = null;
      const next = reducedMotion ? 1 : targetFrameRef.current;
      if (next !== paintedFrameRef.current) draw(next);
    };

    const queuePaint = () => {
      if (drawRafRef.current == null) {
        drawRafRef.current = requestAnimationFrame(paint);
      }
    };

    const updateFromScroll = () => {
      if (reducedMotion) {
        targetFrameRef.current = 1;
        queuePaint();
        return;
      }

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const nextFrame = Math.min(
        frameCount,
        Math.max(1, Math.round(progress * (frameCount - 1)) + 1),
      );
      targetFrameRef.current = nextFrame;
      if (progressDotRef.current) {
        progressDotRef.current.style.top = `${progress * 100}%`;
      }
      queuePaint();
    };

    const updatePointer = (event: PointerEvent) => {
      if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      pointerTargetRef.current = { x, y };
    };

    const animateMotion = (time: number) => {
      motionRafRef.current = requestAnimationFrame(animateMotion);
      if (reducedMotion) return;

      const previous = lastTimeRef.current || time;
      const delta = Math.min(32, time - previous);
      lastTimeRef.current = time;
      const current = pointerCurrentRef.current;
      const target = pointerTargetRef.current;
      const ease = 1 - Math.pow(0.0007, delta / 16.67);
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      const seconds = time / 1000;
      // Add a restrained living quality to the scene: tiny float, breathing
      // scale, and cursor parallax. Scroll remains the dominant motion.
      const floatY = Math.sin(seconds * 0.85) * 2.4;
      const floatX = Math.cos(seconds * 0.58) * 1.1;
      const scale = 1.001 + Math.sin(seconds * 0.82) * 0.0022;
      const tiltX = current.y * -1.15;
      const tiltY = current.x * 1.25;
      stage.style.transform = `translate3d(${floatX + current.x * 5}px, ${floatY + current.y * 3}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
      stage.style.setProperty("--cursor-x", `${50 + current.x * 28}%`);
      stage.style.setProperty("--cursor-y", `${50 + current.y * 24}%`);

    };

    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      queuePaint();
    });
    resizeObserver.observe(canvas);

    updateFromScroll();
    resizeCanvas();
    queuePaint();

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!reducedMotion && !coarsePointer) {
      motionRafRef.current = requestAnimationFrame(animateMotion);
    }

    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      window.removeEventListener("pointermove", updatePointer);
      resizeObserver.disconnect();
      if (drawRafRef.current != null) cancelAnimationFrame(drawRafRef.current);
      if (motionRafRef.current != null) cancelAnimationFrame(motionRafRef.current);
      drawRafRef.current = null;
      motionRafRef.current = null;
    };
  }, [frameCount, ready, reducedMotion, mobile]);

  return (
    <section
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ height: scrollHeight }}
      aria-label="Character reveal scroll animation"
    >
      <div className="hero-sequence sticky top-0 h-[100svh] min-h-screen w-full overflow-hidden">
        <div className="hero-sequence-bg absolute inset-0" aria-hidden="true" />
        <div className="hero-sequence-grid absolute inset-0" aria-hidden="true" />
        <div className="hero-sequence-aurora absolute inset-0" aria-hidden="true" />

        <div className="hero-particles absolute inset-0" aria-hidden="true">
          {PARTICLES.map((particle, i) => (
            <span
              key={i}
              className="hero-particle"
              style={
                {
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  opacity: particle.opacity,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                  ["--particle-drift" as string]: particle.drift,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-sequence-halo absolute left-1/2 top-1/2" aria-hidden="true" />

        <div
          ref={stageRef}
          className="hero-sequence-stage pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="hero-sequence-art absolute inset-0">
            {/* Fast first-frame fallback: it is full-bleed like the canvas, so
                there is no rectangular media card during the loading swap. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${framePath}001.webp`}
              alt=""
              aria-hidden="true"
              decoding="async"
              fetchPriority="high"
              className="hero-sequence-fallback absolute inset-0 h-full w-full object-contain"
            />
            <canvas ref={canvasRef} className="hero-sequence-canvas absolute inset-0 z-[2] block h-full w-full" />
            <div className="hero-sequence-light" />
            <div className="hero-sequence-sheen" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-52 bg-gradient-to-t from-[#05070b] via-[#05070b]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(2,4,8,.16)_62%,rgba(2,4,8,.66)_100%)]" />

        <div className="hero-sequence-progress absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 md:block" aria-hidden="true">
          <span className="hero-progress-line" />
          <span ref={progressDotRef} className="hero-progress-dot" style={{ top: "0%" }} />
          <span className="mt-3 block text-[8px] uppercase tracking-[0.28em] text-white/25">scroll</span>
        </div>
      </div>
    </section>
  );
}
