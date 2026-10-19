import type { StageState } from "@/lib/algo/types";

/**
 * 호출 탑 — 함수가 자기를 부를 때마다 층이 위로 쌓이고, 값을 돌려주면 위에서부터 걷힌다.
 *
 * 맨 위 층이 지금 실행 중이다. 아래 층은 위 층이 끝나기를 기다린다.
 * `slots` 는 가장 높은 층 수 — 층이 늘고 줄어도 그림 높이가 들썩이지 않게 자리를 미리 잡는다.
 */
export function StageTower({ state, slots }: { state: StageState; slots: number }) {
  const frames = state.frames ?? [];
  const top = frames.length - 1;

  return (
    <div
      className="algo-tower"
      role="img"
      aria-label={`호출 탑 ${frames.length}층. ${frames.map((f) => `factorial(${f.n})`).join(", ")}`}
    >
      <ol className="algo-tower-stack" style={{ ["--slots" as string]: slots }}>
        {/* 위가 최근 호출이라 거꾸로 그린다 */}
        {frames
          .map((f, i) => ({ f, i }))
          .reverse()
          .map(({ f, i }) => {
            const returning = f.ret !== undefined;
            const cls = returning ? "back" : i === top ? "on" : "wait";
            return (
              <li key={i} className={`algo-frame ${cls}`}>
                <span>factorial({f.n})</span>
                <b>{returning ? `→ ${f.ret}` : i === top ? "실행 중" : "기다리는 중"}</b>
              </li>
            );
          })}
      </ol>
      <p className="algo-tower-ground">맨 처음 부른 곳</p>
    </div>
  );
}
