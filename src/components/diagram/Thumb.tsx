import type { ThumbKind } from "@/lib/types";

// 카드 썸네일 — cover_image 가 없을 때 쓰는 추상 패턴(12종).
// 각 패턴은 고유 팔레트 + 도형 한 벌. 연결선·점은 도형 앵커(모서리 중앙·중심)에
// 정확히 맞물리도록 좌표를 잡았다. viewBox 400×240, 중심 (200,120).
const palettes: Record<ThumbKind, [string, string, string]> = {
  a: ["#EAF2FE", "#D5E6FD", "#0066FF"], // 파랑 — 흐름
  b: ["#F0ECFE", "#E2D9FE", "#9747FF"], // 보라 — 교집합
  c: ["#E4F8EB", "#C9F0D6", "#00BF40"], // 초록 — 막대
  d: ["#FFF8DB", "#FFEDA8", "#D99F00"], // 황색 — 추이
  e: ["#F4F4F5", "#DBDCDF", "#373840"], // 회색 — 문서
  f: ["#E4F7FA", "#BDEAF1", "#0098B2"], // 청록 — 프로필
  g: ["#ECEDFD", "#DADCFB", "#4F46E5"], // 인디고 — 네트워크
  h: ["#FDECF0", "#FAD7E0", "#E5397A"], // 로즈 — 스택
  i: ["#E2F4FD", "#C5E8FB", "#0EA5E9"], // 하늘 — 타깃
  j: ["#FDEEE2", "#FBDAC2", "#EA580C"], // 주황 — 그리드
  k: ["#F1F8E2", "#E0F0BE", "#5C9A0E"], // 라임 — 트리
  l: ["#FBE9FB", "#F4D3F4", "#C026D3"], // 자홍 — 궤도
};

/**
 * 카드 썸네일 패턴.
 * - 기본: `.thumb`(부모 카드가 높이를 지정) 안에서 렌더.
 * - fill: 부모를 채우는 absolute 박스로 렌더 — 어드민 패턴 피커 미리보기용.
 */
export function Thumb({
  kind = "a",
  fill = false,
}: {
  kind?: ThumbKind;
  fill?: boolean;
}) {
  const [bg1, bg2, fg] = palettes[kind] ?? palettes.a;

  return (
    <div
      className={fill ? undefined : "thumb"}
      style={{
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        ...(fill ? { position: "absolute", inset: 0, overflow: "hidden" } : {}),
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <g
          stroke={fg}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        >
          {/* a — 흐름: 3개 박스를 모서리 중앙끼리 잇는 연결선 */}
          {kind === "a" && (
            <>
              <rect x="68" y="56" width="92" height="52" rx="12" fill={fg} fillOpacity="0.10" />
              <rect x="240" y="56" width="92" height="52" rx="12" fill="#fff" fillOpacity="0.55" />
              <rect x="154" y="152" width="92" height="52" rx="12" fill={fg} fillOpacity="0.16" />
              <path d="M160 82 H240" />
              <path d="M114 108 C114 138, 124 178, 154 178" />
              <path d="M286 108 C286 138, 276 178, 246 178" />
              <circle cx="160" cy="82" r="3" fill={fg} />
              <circle cx="240" cy="82" r="3" fill={fg} />
              <circle cx="154" cy="178" r="3" fill={fg} />
              <circle cx="246" cy="178" r="3" fill={fg} />
            </>
          )}

          {/* b — 교집합: 겹친 두 원 + 중심을 잇는 선, 교차점 표시 */}
          {kind === "b" && (
            <>
              <circle cx="168" cy="120" r="54" fill={fg} fillOpacity="0.10" />
              <circle cx="242" cy="120" r="42" fill="#fff" fillOpacity="0.55" />
              <path d="M168 120 H242" />
              <circle cx="168" cy="120" r="4" fill={fg} />
              <circle cx="242" cy="120" r="4" fill={fg} />
              <circle cx="211" cy="120" r="4" fill="#fff" />
            </>
          )}

          {/* c — 막대: 공통 베이스라인에 정확히 선 막대 3개 */}
          {kind === "c" && (
            <>
              <path d="M76 178 H324" strokeWidth="2" />
              <rect x="104" y="114" width="54" height="64" rx="8" fill={fg} fillOpacity="0.12" />
              <rect x="173" y="82" width="54" height="96" rx="8" fill={fg} fillOpacity="0.20" />
              <rect x="242" y="130" width="54" height="48" rx="8" fill="#fff" fillOpacity="0.55" />
              <circle cx="131" cy="114" r="3.5" fill={fg} />
              <circle cx="200" cy="82" r="3.5" fill={fg} />
              <circle cx="269" cy="130" r="3.5" fill={fg} />
            </>
          )}

          {/* d — 추이: 축 + 꺾은선, 모든 꼭짓점에 점, 정점 강조 */}
          {kind === "d" && (
            <>
              <path d="M86 60 V182 H322" strokeOpacity="0.5" />
              <path
                d="M110 156 L162 110 L214 134 L266 78 L310 100 L310 182 L110 182 Z"
                fill={fg}
                fillOpacity="0.10"
                stroke="none"
              />
              <path d="M110 156 L162 110 L214 134 L266 78 L310 100" strokeWidth="2.5" />
              <circle cx="110" cy="156" r="4" fill={fg} />
              <circle cx="162" cy="110" r="4" fill={fg} />
              <circle cx="214" cy="134" r="4" fill={fg} />
              <circle cx="310" cy="100" r="4" fill={fg} />
              <circle cx="266" cy="78" r="5" fill="#fff" strokeWidth="2" />
            </>
          )}

          {/* e — 문서: 카드 + 좌측 정렬 텍스트 줄 */}
          {kind === "e" && (
            <>
              <rect x="108" y="50" width="184" height="140" rx="14" fill="#fff" fillOpacity="0.5" />
              <rect x="130" y="74" width="104" height="13" rx="4" fill={fg} fillOpacity="0.22" stroke="none" />
              <rect x="130" y="104" width="132" height="8" rx="3" fill={fg} fillOpacity="0.12" stroke="none" />
              <rect x="130" y="120" width="132" height="8" rx="3" fill={fg} fillOpacity="0.12" stroke="none" />
              <rect x="130" y="136" width="98" height="8" rx="3" fill={fg} fillOpacity="0.12" stroke="none" />
              <rect x="130" y="156" width="58" height="18" rx="6" fill={fg} fillOpacity="0.18" stroke="none" />
            </>
          )}

          {/* f — 프로필: 카드 + 아바타(머리·어깨) + 줄 */}
          {kind === "f" && (
            <>
              <rect x="104" y="74" width="192" height="92" rx="16" fill="#fff" fillOpacity="0.55" />
              <circle cx="148" cy="120" r="24" fill={fg} fillOpacity="0.20" />
              <circle cx="148" cy="113" r="8" fill={fg} fillOpacity="0.45" stroke="none" />
              <path d="M134 134 C137 125, 159 125, 162 134" strokeOpacity="0.5" />
              <rect x="192" y="106" width="78" height="11" rx="4" fill={fg} fillOpacity="0.22" stroke="none" />
              <rect x="192" y="128" width="56" height="9" rx="3" fill={fg} fillOpacity="0.12" stroke="none" />
            </>
          )}

          {/* g — 네트워크: 허브에서 노드 중심으로 뻗는 간선 */}
          {kind === "g" && (
            <>
              <path d="M204 118 L104 72" strokeOpacity="0.55" />
              <path d="M204 118 L300 86" strokeOpacity="0.55" />
              <path d="M204 118 L128 180" strokeOpacity="0.55" />
              <path d="M204 118 L288 176" strokeOpacity="0.55" />
              <path d="M104 72 L128 180" strokeOpacity="0.4" />
              <path d="M300 86 L288 176" strokeOpacity="0.4" />
              <circle cx="104" cy="72" r="19" fill="#fff" fillOpacity="0.55" />
              <circle cx="300" cy="86" r="19" fill={fg} fillOpacity="0.10" />
              <circle cx="128" cy="180" r="18" fill={fg} fillOpacity="0.10" />
              <circle cx="288" cy="176" r="18" fill="#fff" fillOpacity="0.55" />
              <circle cx="204" cy="118" r="26" fill={fg} fillOpacity="0.20" />
              <circle cx="204" cy="118" r="4" fill={fg} stroke="none" />
            </>
          )}

          {/* h — 스택: 같은 크기 카드 3장을 일정 오프셋(-20,+28)으로 적층 */}
          {kind === "h" && (
            <>
              <rect x="148" y="54" width="152" height="64" rx="14" fill={fg} fillOpacity="0.10" />
              <rect x="128" y="82" width="152" height="64" rx="14" fill={fg} fillOpacity="0.18" />
              <rect x="108" y="110" width="152" height="64" rx="14" fill="#fff" fillOpacity="0.6" />
              <rect x="124" y="126" width="64" height="10" rx="3" fill={fg} fillOpacity="0.22" stroke="none" />
              <rect x="124" y="144" width="44" height="8" rx="3" fill={fg} fillOpacity="0.12" stroke="none" />
            </>
          )}

          {/* i — 타깃: 동심원 + 중심에서 외곽 마커로 뻗는 반경선 */}
          {kind === "i" && (
            <>
              <circle cx="200" cy="120" r="70" strokeOpacity="0.5" />
              <circle cx="200" cy="120" r="46" fill={fg} fillOpacity="0.08" />
              <path d="M200 120 L250 70" strokeOpacity="0.55" />
              <circle cx="200" cy="120" r="22" fill="#fff" fillOpacity="0.55" />
              <circle cx="200" cy="120" r="5" fill={fg} stroke="none" />
              <circle cx="250" cy="70" r="8" fill={fg} stroke="#fff" strokeWidth="2" />
            </>
          )}

          {/* j — 그리드: 균등 간격 2×2 사각형 + 중앙 점 */}
          {kind === "j" && (
            <>
              <rect x="125" y="45" width="64" height="64" rx="12" fill={fg} fillOpacity="0.18" />
              <rect x="211" y="45" width="64" height="64" rx="12" fill="#fff" fillOpacity="0.55" />
              <rect x="125" y="131" width="64" height="64" rx="12" fill="#fff" fillOpacity="0.55" />
              <rect x="211" y="131" width="64" height="64" rx="12" fill={fg} fillOpacity="0.12" />
              <circle cx="157" cy="77" r="9" fill="#fff" fillOpacity="0.7" stroke="none" />
              <circle cx="243" cy="77" r="9" fill={fg} fillOpacity="0.3" stroke="none" />
              <circle cx="157" cy="163" r="9" fill={fg} fillOpacity="0.3" stroke="none" />
              <circle cx="243" cy="163" r="9" fill="#fff" fillOpacity="0.7" stroke="none" />
            </>
          )}

          {/* k — 트리: 루트→자식→잎, 간선이 노드 중심에 맞물림 */}
          {kind === "k" && (
            <>
              <path d="M200 58 L120 130" strokeOpacity="0.55" />
              <path d="M200 58 L280 130" strokeOpacity="0.55" />
              <path d="M120 130 L86 196" strokeOpacity="0.55" />
              <path d="M120 130 L156 196" strokeOpacity="0.55" />
              <circle cx="280" cy="130" r="18" fill={fg} fillOpacity="0.10" />
              <circle cx="86" cy="196" r="14" fill={fg} fillOpacity="0.14" />
              <circle cx="156" cy="196" r="14" fill="#fff" fillOpacity="0.5" />
              <circle cx="120" cy="130" r="18" fill="#fff" fillOpacity="0.55" />
              <circle cx="200" cy="58" r="20" fill={fg} fillOpacity="0.20" />
              <circle cx="200" cy="58" r="3.5" fill={fg} stroke="none" />
            </>
          )}

          {/* l — 궤도: 점선 타원 위에 정확히 놓인 위성 */}
          {kind === "l" && (
            <>
              <ellipse
                cx="200"
                cy="120"
                rx="104"
                ry="62"
                strokeDasharray="2 7"
                strokeOpacity="0.7"
              />
              <circle cx="110" cy="151" r="9" fill={fg} fillOpacity="0.25" />
              <circle cx="200" cy="120" r="32" fill={fg} fillOpacity="0.18" />
              <circle cx="200" cy="120" r="6" fill={fg} stroke="none" />
              <circle cx="280" cy="80" r="14" fill="#fff" fillOpacity="0.6" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
