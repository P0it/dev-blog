import type { StageState } from "@/lib/algo/types";
import { factorial } from "@/lib/algo/permutations";

/**
 * 줄 서는 순서 무대 — 자리에 선 친구, 아직 서지 않은 친구, 결과에 담은 순서를 한 화면에 둔다.
 *
 * 위 칸은 자리다. 앞자리부터 채워지고 되돌리면 뒤에서부터 비워진다.
 * 가운데 줄은 친구다. 이미 선 친구는 흐려지고, 방금 뺀 친구는 다시 고를 수 있다는 표시가 붙는다.
 * 아래 목록은 결과에 담은 순서다. 자리가 다 차면 한 가지가 새로 담긴다.
 */
export function StagePerm({ state }: { state: StageState }) {
  const p = state.perm;
  if (!p) return null;

  const n = p.items.length;
  const total = factorial(n);
  const full = p.path.length === n && n > 0;
  const newest = p.mode === "found" ? p.result.length - 1 : -1;

  return (
    <div
      className="algo-perm-stage"
      role="img"
      aria-label={`자리 ${n}개. 선 친구 ${p.path.map((k) => p.items[k]).join(", ") || "없음"}. 결과에 담은 순서 ${p.result.length}가지`}
    >
      <ol className="algo-perm-slots">
        {Array.from({ length: n }, (_, k) => {
          const on = k < p.path.length;
          return (
            <li
              key={k}
              className="algo-perm-slot"
              data-on={on ? "" : undefined}
              data-full={on && full ? "" : undefined}
              data-hot={on && k === p.path.length - 1 && p.mode === "choose" ? "" : undefined}
            >
              <small>{k + 1}번째 자리</small>
              <b>{on ? p.items[p.path[k]] : ""}</b>
            </li>
          );
        })}
      </ol>

      <ul className="algo-perm-friends">
        {p.items.map((name, k) => (
          <li
            key={k}
            className="algo-perm-friend"
            data-used={p.used[k] ? "" : undefined}
            data-free={p.mode === "undo" && p.i === k ? "" : undefined}
          >
            <b>{name}</b>
            <small>{p.used[k] ? "서 있음" : p.mode === "undo" && p.i === k ? "표시를 지움" : "고를 수 있음"}</small>
          </li>
        ))}
      </ul>

      <p className="algo-perm-found-title">
        결과에 담은 순서 <b>{p.result.length}</b>가지
      </p>
      <ol className="algo-perm-found">
        {Array.from({ length: Math.max(total, p.result.length) }, (_, k) => (
          <li key={k} data-on={k < p.result.length ? "" : undefined} data-new={k === newest ? "" : undefined}>
            {k < p.result.length ? p.result[k] || "빈 줄" : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
