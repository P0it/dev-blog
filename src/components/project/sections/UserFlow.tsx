import { Mermaid } from "@/components/post/Mermaid";

export type FlowStep = { label: string; md: string };

// 유저 플로우 — 사람이 움직이는 길. 데이터가 흐르는 길인 `구조` 와 역할이 다르다.
// 동선은 대개 가로로 길어 폭을 다 쓰고, 설명은 다이어그램 아래에 깐다.
export function UserFlow({ diagram, steps }: { diagram: string | null; steps: FlowStep[] }) {
  return (
    <div className="lab-flow lab-reveal">
      {diagram && (
        <div className="lab-panel lab-flow-diagram">
          <Mermaid code={diagram} />
        </div>
      )}
      {steps.length > 0 && (
        <ol className="lab-flow-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <b>{s.label}</b>
              {s.md && <span>{s.md}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
