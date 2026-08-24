import { Mermaid } from "@/components/post/Mermaid";

export type FlowStep = {
  label: string;
  md: string;
  branches: { when: string; then: string }[];
};

// 유저 플로우 — 사람이 움직이는 길. 데이터가 흐르는 길인 `구조` 와 역할이 다르다.
//
// 원고는 단계 목록만 담고 그림은 여기서 그린다. mermaid 에 맡기면 프로젝트마다
// 레이아웃이 제각각이고 한글 노드 폭도 흔들려서, 카드로 고정했다.
// 단계 없이 mermaid 만 쓴 옛 원고는 그대로 다이어그램으로 떨어진다.
//
// 세로로 쌓는다. 가로 레일은 페이지의 다른 섹션과 조작이 달라, 읽던 손이
// 여기서만 방향을 바꿔야 했다. 휠만 있는 마우스는 넘기지도 못했다.
//
// 개발 과정도 세로라 형태를 갈라 둔다 — 그쪽은 선에 꿴 맨 글, 이쪽은 카드가
// 아래 화살표로 이어지는 흐름이다. 갈림길은 카드 오른쪽으로 뻗는다.
export function UserFlow({ diagram, steps }: { diagram: string | null; steps: FlowStep[] }) {
  if (steps.length === 0) {
    return diagram ? (
      <div className="lab-panel lab-flow-diagram lab-reveal">
        <Mermaid code={diagram} />
      </div>
    ) : null;
  }

  return (
    <ol className="lab-uflow lab-stagger">
      {steps.map((s, i) => (
        <li key={i} className="lab-uflow-step">
          <div className={`lab-panel lab-uflow-card${s.branches.length > 0 ? " has-branch" : ""}`}>
            <span className="lab-uflow-num">{String(i + 1).padStart(2, "0")}</span>
            <div className="lab-uflow-main">
              <b className="lab-uflow-label">{s.label}</b>
              {s.md && <p className="lab-uflow-desc">{s.md}</p>}
            </div>
            {s.branches.length > 0 && (
              <div className="lab-uflow-branches">
                {s.branches.map((b, j) => (
                  <span key={j} className="lab-uflow-branch">
                    <em>{b.when}</em>
                    {b.then}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* 마지막 카드 뒤에는 화살표를 두지 않는다. CSS 가 :last-child 로 지운다. */}
          <span className="lab-uflow-link" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}
