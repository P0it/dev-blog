import type { StageState } from "@/lib/algo/types";

/**
 * 호출 탑 + 수첩 — 왼쪽은 함수가 자기를 부르며 쌓이는 층, 오른쪽은 지금까지 수첩에 적힌 `n → fib(n)` 이다.
 *
 * 호출 탑은 재귀 쪽의 무대(`StageTower`)와 같은 모양이되 층 이름이 `fib(n)` 이고, 수첩에서 꺼내 쓰는 층은 따로 칠한다.
 * `slots` 는 가장 높은 층 수, `size` 는 수첩의 칸 수(0 부터 n 까지) — 둘 다 그림 높이가 들썩이지 않게 미리 잡는다.
 */
export function StageMemo({ state, slots, size }: { state: StageState; slots: number; size: number }) {
  const frames = state.frames ?? [];
  const top = frames.length - 1;
  const hit = state.memo?.hit === true;
  const book = new Map((state.memo?.notebook ?? []).map((e) => [e.n, e.v]));
  const nowN = top >= 0 ? frames[top].n : null;

  return (
    <div className="algo-memo-stage">
      <div
        className="algo-tower"
        role="img"
        aria-label={`호출 탑 ${frames.length}층. ${frames.map((f) => `fib(${f.n})`).join(", ")}`}
      >
        <p className="algo-memo-head">호출 탑</p>
        <ol className="algo-tower-stack" style={{ ["--slots" as string]: slots }}>
          {frames
            .map((f, i) => ({ f, i }))
            .reverse()
            .map(({ f, i }) => {
              const returning = f.ret !== undefined;
              const isHit = hit && i === top;
              const cls = isHit ? "hit" : returning ? "back" : i === top ? "on" : "wait";
              return (
                <li key={i} className={`algo-frame ${cls}`}>
                  <span>fib({f.n})</span>
                  <b>{isHit ? `수첩에서 ${f.ret}` : returning ? `→ ${f.ret}` : i === top ? "실행 중" : "기다리는 중"}</b>
                </li>
              );
            })}
        </ol>
        <p className="algo-tower-ground">맨 처음 부른 곳</p>
      </div>

      <div className="algo-memo-book" role="img" aria-label={`수첩. ${book.size}칸에 값이 적혀 있다`}>
        <p className="algo-memo-head">수첩</p>
        <ul>
          {Array.from({ length: size }, (_, n) => {
            const v = book.get(n);
            return (
              <li key={n} data-filled={v !== undefined} data-now={n === nowN}>
                <span>fib({n})</span>
                <b>{v !== undefined ? v : "·"}</b>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
