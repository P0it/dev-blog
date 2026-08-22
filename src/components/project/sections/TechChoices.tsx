import { resolveStack } from "@/lib/tech-icons";

// 무엇을 썼는지만 보여주는 자리다. 고른 이유는 개발 과정 서사에서 드러난다.
// 아이콘은 simple-icons 에서 미리 구워 둔 path 라 외부 요청이 없다.
export function TechChoices({ items }: { items: string[] }) {
  const chips = resolveStack(items);
  if (chips.length === 0) return null;

  return (
    <div className="lab-stack lab-reveal">
      {chips.map((c) => (
        <span
          key={c.name}
          className="lab-stack-chip"
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
  );
}
