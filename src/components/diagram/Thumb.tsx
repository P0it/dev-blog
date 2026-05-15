import type { ThumbKind } from "@/lib/types";

const palettes: Record<ThumbKind, [string, string, string]> = {
  a: ["#EAF2FE", "#D5E6FD", "#0066FF"],
  b: ["#F0ECFE", "#E2D9FE", "#9747FF"],
  c: ["#E4F8EB", "#C9F0D6", "#00BF40"],
  d: ["#FFF8DB", "#FFEDA8", "#D99F00"],
  e: ["#F4F4F5", "#DBDCDF", "#373840"],
  f: ["#E4F7FA", "#BDEAF1", "#0098B2"],
};

export function Thumb({ kind = "a" }: { kind?: ThumbKind }) {
  const [bg1, bg2, fg] = palettes[kind];

  return (
    <div
      className="thumb"
      style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <g stroke={fg} fill="none" strokeWidth="1.5" opacity="0.85">
          {kind === "a" && (
            <>
              <rect x="120" y="60" width="100" height="50" rx="10" fill={fg} fillOpacity="0.08" />
              <rect x="240" y="80" width="80" height="50" rx="10" fill="#fff" fillOpacity="0.5" />
              <rect x="160" y="140" width="120" height="50" rx="10" fill={fg} fillOpacity="0.12" />
              <path d="M170 110 C 200 130, 240 130, 260 110" strokeDasharray="4 4" />
              <path d="M260 130 C 250 150, 230 150, 220 140" />
            </>
          )}
          {kind === "b" && (
            <>
              <circle cx="180" cy="120" r="50" fill={fg} fillOpacity="0.1" />
              <circle cx="240" cy="120" r="36" fill="#fff" fillOpacity="0.6" />
              <path d="M120 200 L 280 200" strokeWidth="2" />
              <circle cx="160" cy="200" r="4" fill={fg} />
              <circle cx="220" cy="200" r="4" fill={fg} />
            </>
          )}
          {kind === "c" && (
            <>
              <rect x="100" y="80" width="60" height="80" rx="8" fill={fg} fillOpacity="0.1" />
              <rect x="170" y="60" width="60" height="100" rx="8" fill={fg} fillOpacity="0.18" />
              <rect x="240" y="100" width="60" height="60" rx="8" fill="#fff" fillOpacity="0.6" />
            </>
          )}
          {kind === "d" && (
            <>
              <path d="M80 180 L 140 130 L 200 160 L 260 90 L 320 110" strokeWidth="2.5" fill="none" />
              <circle cx="140" cy="130" r="5" fill={fg} />
              <circle cx="200" cy="160" r="5" fill={fg} />
              <circle cx="260" cy="90" r="5" fill={fg} />
            </>
          )}
          {kind === "e" && (
            <>
              <rect x="100" y="70" width="200" height="14" rx="3" fill={fg} fillOpacity="0.15" />
              <rect x="100" y="100" width="160" height="10" rx="3" fill={fg} fillOpacity="0.1" />
              <rect x="100" y="120" width="180" height="10" rx="3" fill={fg} fillOpacity="0.1" />
              <rect x="100" y="150" width="100" height="32" rx="6" fill={fg} fillOpacity="0.2" />
            </>
          )}
          {kind === "f" && (
            <>
              <rect x="120" y="80" width="160" height="80" rx="12" fill="#fff" fillOpacity="0.6" />
              <circle cx="160" cy="120" r="14" fill={fg} fillOpacity="0.4" />
              <rect x="190" y="105" width="70" height="8" rx="2" fill={fg} fillOpacity="0.3" />
              <rect x="190" y="125" width="50" height="8" rx="2" fill={fg} fillOpacity="0.2" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
