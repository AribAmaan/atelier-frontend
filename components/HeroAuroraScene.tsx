"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const GOLD = "#c9a227";
const ROSE = "#b5657a";
const VIOLET = "#8b5cf6";

/* ---------------------------------------------------------------------- */
/* Scroll progress — 0 at the top of the hero, 1 after one viewport height */
/* of scrolling, then held at 1 for the rest of the page. Read by several  */
/* scene pieces below via a shared ref so only one scroll listener exists. */
/* ---------------------------------------------------------------------- */
function useScrollProgress() {
  const progress = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const heroPx = window.innerHeight || 1;
      progress.current = Math.min(Math.max(window.scrollY / heroPx, 0), 1);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return progress;
}

/* ---------------------------------------------------------------------- */
/* Aurora ribbons — layered wavy planes, displaced with sine waves each   */
/* frame so they roll like the CSS aurora blobs used elsewhere, just in   */
/* actual 3D and lit for the bloom pass to catch.                         */
/* ---------------------------------------------------------------------- */
function AuroraLayer({
  color,
  yOffset,
  speed,
  amplitude,
  opacity,
  reduceMotion,
  scrollProgress,
}: {
  color: string;
  yOffset: number;
  speed: number;
  amplitude: number;
  opacity: number;
  reduceMotion: boolean;
  scrollProgress: React.RefObject<number>;
}) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(18, 8, 56, 28), []);
  const basePositions = useMemo(
    () => (geometry.attributes.position as THREE.BufferAttribute).array.slice(),
    [geometry]
  );

  useFrame(({ clock }) => {
    // Ambient fade instead of a hard cutoff, so the aurora recedes into a
    // quiet backdrop glow behind the content sections rather than vanishing.
    if (materialRef.current) {
      materialRef.current.opacity = opacity * (1 - scrollProgress.current * 0.75);
    }
    if (reduceMotion) return;
    const t = clock.getElapsedTime() * speed;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const z =
        Math.sin(x * 0.45 + t) * amplitude +
        Math.cos(y * 0.35 - t * 0.7) * amplitude * 0.5;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh geometry={geometry} position={[0, yOffset, -2]} rotation={[-Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------------- */
/* Centerpiece gem — the "workshop for characters" motif: a faceted       */
/* crystal that idles with a gentle float/rotate, brightens on the bloom  */
/* pass, and nudges toward the cursor a little more than the background.  */
/* ---------------------------------------------------------------------- */
function CenterpieceGem({
  reduceMotion,
  scrollProgress,
}: {
  reduceMotion: boolean;
  scrollProgress: React.RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const fade = 1 - Math.min(scrollProgress.current * 1.4, 1);
    if (outerMatRef.current) outerMatRef.current.opacity = 0.44 * fade;
    if (innerMatRef.current) innerMatRef.current.opacity = 0.82 * fade;

    if (reduceMotion || !meshRef.current || !innerRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.18;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    innerRef.current.rotation.y = -t * 0.25;
  });

  return (
    <Float speed={reduceMotion ? 0 : 1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <group position={[0, 0.6, 0]}>
        {/* outer faceted shell — env map gives it real reflections/highlights */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshPhysicalMaterial
            ref={outerMatRef}
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={0.5}
            metalness={0.65}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.6}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* inner core, counter-rotating, rose-toned */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshBasicMaterial ref={innerMatRef} color={ROSE} transparent opacity={0.7} wireframe />
        </mesh>
        <pointLight color={GOLD} intensity={8} distance={7} decay={2} />
      </group>
    </Float>
  );
}

/* ---------------------------------------------------------------------- */
/* Ember field — a sprinkle of drifting motes in the palette, upward drift */
/* with gentle sideways sway, wrapping back to the bottom once off-screen. */
/* ---------------------------------------------------------------------- */
function EmberField({
  count = 140,
  reduceMotion,
  scrollProgress,
}: {
  count?: number;
  reduceMotion: boolean;
  scrollProgress: React.RefObject<number>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { positions, seeds, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color(GOLD), new THREE.Color(ROSE), new THREE.Color(VIOLET)];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      seeds[i] = Math.random() * 10;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, seeds, colors };
  }, [count]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.75 * (1 - scrollProgress.current * 0.6);
    }
    if (reduceMotion || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      let y = pos.getY(i) + 0.0022 + Math.sin(t + seed) * 0.0004;
      if (y > 4.6) y = -4.6;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.4 + seed) * 0.0009);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.045}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ---------------------------------------------------------------------- */
/* Cursor sparkle trail — a fixed pool of points that respawn at the      */
/* pointer's position (unprojected onto a world-space plane) and fade out */
/* via color brightness rather than per-vertex opacity, since three.js's  */
/* PointsMaterial doesn't support per-point alpha without a custom shader.*/
/* Lives site-wide since the canvas is now a fixed full-page background.  */
/* ---------------------------------------------------------------------- */
function CursorTrail({ reduceMotion }: { reduceMotion: boolean }) {
  const count = 44;
  const pointsRef = useRef<THREE.Points>(null);
  const pointerScreen = useRef({ x: 0, y: 0, active: false });
  const { camera, size } = useThree();

  const { positions, colors, life, baseColor } = useMemo(() => {
    const positions = new Float32Array(count * 3).fill(9999);
    const colors = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const palette = [new THREE.Color(GOLD), new THREE.Color(ROSE), new THREE.Color(VIOLET)];
    const baseColor: THREE.Color[] = [];
    for (let i = 0; i < count; i++) baseColor.push(palette[i % palette.length]);
    return { positions, colors, life, baseColor };
  }, [count]);

  const cursor = useRef(0);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -1), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (reduceMotion) return;
    const handleMove = (e: MouseEvent) => {
      pointerScreen.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reduceMotion]);

  useFrame(() => {
    if (reduceMotion || !pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const col = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;

    if (pointerScreen.current.active && size.width > 0) {
      ndc.set(
        (pointerScreen.current.x / size.width) * 2 - 1,
        -(pointerScreen.current.y / size.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hitPoint)) {
        const i = cursor.current;
        pos.setXYZ(
          i,
          hitPoint.x + (Math.random() - 0.5) * 0.15,
          hitPoint.y + (Math.random() - 0.5) * 0.15,
          hitPoint.z
        );
        life[i] = 1;
        cursor.current = (i + 1) % count;
      }
    }

    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) continue;
      life[i] = Math.max(life[i] - 0.02, 0);
      const c = baseColor[i];
      col.setXYZ(i, c.r * life[i], c.g * life[i], c.b * life[i]);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  if (reduceMotion) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ---------------------------------------------------------------------- */
/* Camera rig — eases toward the cursor for parallax, plus a one-time     */
/* dolly-in from further back so the scene has an entrance on load.       */
/* Pointer is tracked on window, not the canvas, so the canvas can stay   */
/* pointer-events: none and never steal clicks from the real UI above it. */
/* ---------------------------------------------------------------------- */
function CameraRig({
  reduceMotion,
  scrollProgress,
}: {
  reduceMotion: boolean;
  scrollProgress: React.RefObject<number>;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useFrame(({ camera, clock }) => {
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;
    const introT = reduceMotion ? 1 : Math.min(elapsed / 1.8, 1);
    const eased = 1 - Math.pow(1 - introT, 3);
    const introZ = THREE.MathUtils.lerp(13, 8.5, eased);

    const scroll = scrollProgress.current;
    const target = pointer.current;
    camera.position.x += ((reduceMotion ? 0 : target.x) * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (2.1 - scroll * 2.6 + (reduceMotion ? 0 : target.y) * 0.55 - camera.position.y) * 0.04;
    camera.position.z += (introZ + scroll * 3 - camera.position.z) * 0.05;
    camera.lookAt(0, 0.3 - scroll * 1.2, 0);
  });

  return null;
}

export default function HeroAuroraScene() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [canUseWebGL, setCanUseWebGL] = useState<boolean | null>(null);
  const [isLowPower, setIsLowPower] = useState(false);
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(mq.matches);
    updateMotion();
    mq.addEventListener("change", updateMotion);

    const canvas = document.createElement("canvas");
    let supported = false;
    try {
      supported = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      supported = false;
    }
    setCanUseWebGL(supported);

    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowPower =
      nav.connection?.saveData === true ||
      (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) ||
      (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4);
    setIsLowPower(lowPower);

    return () => mq.removeEventListener("change", updateMotion);
  }, []);

  if (canUseWebGL !== true) return null;

  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  // Keep the 3D hero visible on capable desktop devices. On constrained devices,
  // reduce the scene rather than removing it entirely.
  const particleCount = isCoarsePointer ? 54 : isLowPower ? 90 : 140;
  const pixelRatio = isCoarsePointer
    ? ([1, 1.1] as [number, number])
    : isLowPower
      ? ([1, 1.2] as [number, number])
      : ([1, 1.5] as [number, number]);

  return (
    <Canvas
      camera={{ position: [0, 2, 13], fov: 50 }}
      dpr={pixelRatio}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <fog attach="fog" args={["#0a0a0c", 8, 20]} />
      <ambientLight intensity={0.4} />
      {/* Free HDRI, fetched from drei's asset CDN at runtime — gives the
          gem's clearcoat material real reflections instead of flat shading.
          background=false keeps it lighting-only; the canvas itself stays
          alpha-transparent over the page's own dark background. */}
      <Environment preset="night" background={false} />

      <CameraRig reduceMotion={reduceMotion} scrollProgress={scrollProgress} />
      <CenterpieceGem reduceMotion={reduceMotion} scrollProgress={scrollProgress} />
      <EmberField count={particleCount} reduceMotion={reduceMotion} scrollProgress={scrollProgress} />
      <CursorTrail reduceMotion={reduceMotion || isCoarsePointer} />

      <AuroraLayer color={GOLD} yOffset={-1.1} speed={0.35} amplitude={0.9} opacity={0.24} reduceMotion={reduceMotion} scrollProgress={scrollProgress} />
      <AuroraLayer color={ROSE} yOffset={-1.4} speed={0.5} amplitude={0.7} opacity={0.19} reduceMotion={reduceMotion} scrollProgress={scrollProgress} />
      <AuroraLayer color={VIOLET} yOffset={-1.7} speed={0.28} amplitude={1.1} opacity={0.15} reduceMotion={reduceMotion} scrollProgress={scrollProgress} />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur radius={0.6} />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
