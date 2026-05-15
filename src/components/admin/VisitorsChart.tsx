const points: [number, number][] = [
  [40, 140],
  [130, 110],
  [220, 130],
  [310, 80],
  [400, 100],
  [490, 60],
  [570, 90],
];
const days = ["월", "화", "수", "목", "금", "토", "일"];

export function VisitorsChart() {
  return (
    <svg viewBox="0 0 600 220" style={{ width: "100%", marginTop: 16 }}>
      <defs>
        <linearGradient id="vg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="20" x2="580" y1={y} y2={y} stroke="var(--line-subtle)" strokeDasharray="2 4" />
      ))}
      <path
        d="M40 140 L 130 110 L 220 130 L 310 80 L 400 100 L 490 60 L 570 90"
        stroke="#0066FF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 140 L 130 110 L 220 130 L 310 80 L 400 100 L 490 60 L 570 90 L 570 200 L 40 200 Z"
        fill="url(#vg)"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#0066FF" stroke="#fff" strokeWidth="1.5" />
      ))}
      {days.map((d, i) => (
        <text
          key={d}
          x={40 + i * 88}
          y="216"
          fontSize="11"
          fill="#707380"
          textAnchor="middle"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}
