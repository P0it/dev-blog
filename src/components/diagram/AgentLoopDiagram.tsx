export function AgentLoopDiagram() {
  return (
    <div className="diagram" style={{ margin: "32px 0" }}>
      <svg viewBox="0 0 720 320" width="100%">
        <defs>
          <marker
            id="agent-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#373840" />
          </marker>
        </defs>

        <g>
          <rect x="20" y="130" width="120" height="60" rx="12" fill="#FFF8DB" stroke="#D99F00" strokeWidth="1" />
          <text x="80" y="158" textAnchor="middle" fontSize="13" fontWeight="600" fill="#373840">사용자 입력</text>
          <text x="80" y="176" textAnchor="middle" fontSize="11" fill="#707380">User prompt</text>
        </g>
        <g>
          <rect x="220" y="40" width="160" height="80" rx="14" fill="#EAF2FE" stroke="#0066FF" strokeWidth="1.2" />
          <text x="300" y="76" textAnchor="middle" fontSize="14" fontWeight="700" fill="#171719">LLM 추론</text>
          <text x="300" y="96" textAnchor="middle" fontSize="11" fill="#707380">Claude / GPT-5</text>
        </g>
        <g>
          <rect x="460" y="40" width="160" height="80" rx="14" fill="#F0ECFE" stroke="#9747FF" strokeWidth="1.2" />
          <text x="540" y="76" textAnchor="middle" fontSize="14" fontWeight="700" fill="#171719">도구 호출</text>
          <text x="540" y="96" textAnchor="middle" fontSize="11" fill="#707380">read · write · run</text>
        </g>
        <g>
          <rect x="460" y="200" width="160" height="80" rx="14" fill="#E4F8EB" stroke="#00BF40" strokeWidth="1.2" />
          <text x="540" y="236" textAnchor="middle" fontSize="14" fontWeight="700" fill="#171719">관찰</text>
          <text x="540" y="256" textAnchor="middle" fontSize="11" fill="#707380">tool result</text>
        </g>
        <g>
          <rect x="220" y="200" width="160" height="80" rx="14" fill="#fff" stroke="#DBDCDF" strokeWidth="1.2" />
          <text x="300" y="236" textAnchor="middle" fontSize="14" fontWeight="700" fill="#171719">최종 응답</text>
          <text x="300" y="256" textAnchor="middle" fontSize="11" fill="#707380">to user</text>
        </g>

        <path d="M140 160 C 180 160, 190 100, 220 80" stroke="#373840" strokeWidth="1.5" fill="none" markerEnd="url(#agent-arrow)" />
        <path d="M380 80 L 460 80" stroke="#373840" strokeWidth="1.5" fill="none" markerEnd="url(#agent-arrow)" />
        <path d="M540 120 L 540 200" stroke="#373840" strokeWidth="1.5" fill="none" markerEnd="url(#agent-arrow)" />
        <path d="M460 240 L 380 240" stroke="#373840" strokeWidth="1.5" fill="none" markerEnd="url(#agent-arrow)" />
        <path d="M300 200 C 280 160, 280 130, 280 120" stroke="#373840" strokeWidth="1.5" fill="none" markerEnd="url(#agent-arrow)" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}
