/**
 * 같은 입력에 두 방법을 돌려 연산 횟수를 나란히 보인다.
 *
 * "왜 이걸 고르나"는 말로 설명하는 것보다 숫자 두 줄이 빠르다.
 */
export function Counter({
  rows,
  caption,
}: {
  rows: { label: string; n: number; unit?: string }[];
  caption?: string;
}) {
  const max = Math.max(...rows.map((r) => r.n), 1);

  return (
    <figure className="algo-counter">
      {rows.map((r) => (
        <div key={r.label} className="algo-counter-row">
          <span className="algo-counter-label">{r.label}</span>
          <span className="algo-counter-bar">
            <i style={{ width: `${Math.max(2, (r.n / max) * 100)}%` }} />
          </span>
          <b className="algo-counter-n">
            {r.n.toLocaleString("ko-KR")}
            {r.unit && <em>{r.unit}</em>}
          </b>
        </div>
      ))}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
