type LogoProps = {
  className?: string;
  size?: number;
  decorative?: boolean;
};

/** Transparent vector mark. Explicit dimensions prevent stretching or layout shift. */
export default function Logo({ className = "", size = 32, decorative = false }: LogoProps) {
  return (
    <span className={`logo-wrap ${className}`} style={{ width: size, height: size }}>
      {/* A static SVG stays sharp without an image-optimization request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/rolichat-mark.svg"
        alt={decorative ? "" : "Rolichat"}
        aria-hidden={decorative || undefined}
        width={size}
        height={size}
        draggable={false}
      />
    </span>
  );
}
