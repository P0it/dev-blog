import { MarkdownView } from "@/components/post/MarkdownView";
import { resolveStack } from "@/lib/tech-icons";

export type JourneyStep = { label: string; md: string; added: string[] };

// 개발 과정 — 왜 이 생각을 했고 어디서 막혀 무엇을 붙였는지의 흐름.
// 시행착오가 개별 사건의 부검이라면, 여기는 프로젝트 전체의 줄거리다.
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="lab-journey lab-stagger">
      {steps.map((s, i) => (
        <li key={i} className="lab-journey-step">
          <span className="lab-journey-num">{String(i + 1).padStart(2, "0")}</span>
          <div className="lab-journey-body">
            <h3>{s.label}</h3>
            {s.md && (
              <div className="lab-prose">
                <MarkdownView md={s.md} />
              </div>
            )}
            {s.added.length > 0 && (
              <div className="lab-journey-added">
                <span className="lab-journey-added-label">붙인 것</span>
                <div className="lab-stack">
                  {resolveStack(s.added).map((c) => (
                    <span
                      key={c.name}
                      className="lab-stack-chip sm"
                      style={{ ["--tc-light" as string]: c.light, ["--tc-dark" as string]: c.dark }}
                    >
                      {c.icon ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d={c.icon.path} />
                        </svg>
                      ) : (
                        <i aria-hidden="true">{c.letter}</i>
                      )}
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
