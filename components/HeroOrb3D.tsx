"use client";

import Logo from "@/components/Logo";
import Tilt3D from "@/components/Tilt3D";

const ORBITERS = [
  { emoji: "🌙", color: "#8b5cf6", radiusClass: "orbit-radius-sm", duration: 16, offset: 0 },
  { emoji: "🌹", color: "#b5657a", radiusClass: "orbit-radius-lg", duration: 22, offset: -7.3 },
  { emoji: "🕵️", color: "#06b6d4", radiusClass: "orbit-radius-sm", duration: 16, offset: -5.3 },
  { emoji: "✨", color: "#c9a227", radiusClass: "orbit-radius-lg", duration: 22, offset: -14.7 },
  { emoji: "🦇", color: "#8a3d54", radiusClass: "orbit-radius-sm", duration: 16, offset: -10.7 },
];

export default function HeroOrb3D() {
  return (
    <Tilt3D
      maxTilt={8}
      scale={1}
      glare={false}
      className="orbit-scene mx-auto"
      style={{ width: "min(88vw, 420px)", aspectRatio: "1 / 1" }}
    >
      {/* Static backdrop glow so the whole thing reads as one lit object */}
      <div className="orbit-backdrop" aria-hidden />

      {/* Two counter-rotating rings for depth, independent of the tilt above */}
      <div className="orbit-ring orbit-ring-a" aria-hidden />
      <div className="orbit-ring orbit-ring-b" aria-hidden />

      {/* The gem itself, floating dead center */}
      <div className="orbit-core">
        <Logo size={92} />
      </div>

      {/* Orbiting cast, billboarded so they always face forward */}
      {ORBITERS.map((o, i) => (
        <div
          key={i}
          className="orbit-track"
          style={{
            animationDuration: `${o.duration}s`,
            animationDelay: `${o.offset}s`,
          }}
        >
          <div className={`orbit-item ${o.radiusClass}`}>
            <div
              className="orbit-counter"
              style={{
                animationDuration: `${o.duration}s`,
                animationDelay: `${o.offset}s`,
              }}
            >
              <div
                className="orbit-chip"
                style={{ boxShadow: `0 0 24px ${o.color}55, 0 4px 14px rgba(0,0,0,0.4)`, borderColor: `${o.color}55` }}
              >
                {o.emoji}
              </div>
            </div>
          </div>
        </div>
      ))}
    </Tilt3D>
  );
}
