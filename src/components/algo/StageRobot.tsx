import type { StageState } from "@/lib/algo/types";
import { ARROWS, DIR_OBJ } from "@/lib/algo/simulation";

/**
 * 로봇 방 무대 — 명령을 한 글자씩 따라 하며 로봇이 **어디로 가고 어디서 막히는지**가 그림의 내용이다.
 *
 * 위 줄은 명령 줄이다(끝난 명령은 진하게, 지금 읽는 명령은 파랗게, 막힌 F 는 빨갛게). 방은 벽이 어두운 칸이고,
 * 로봇은 보는 방향의 화살표로 보인다. 지나온 칸은 연하게 칠한다. F 가 가려는 앞 칸(`ahead`)에는 점선 테두리가 서고,
 * 그 칸이 막힌 칸이면 빨갛게 바뀐다. 앞이 방 바깥이면 칸이 없으니 아래 글로 알린다.
 */
export function StageRobot({ state }: { state: StageState }) {
  const rb = state.robot;
  if (!rb) return null;
  const here = rb.r * rb.cols + rb.c;
  const trail = new Set(rb.trail);

  return (
    <div className="algo-grid-wrap">
      <p className="algo-sim-cmds" role="img" aria-label={`명령 ${rb.cmds.join(" ")}`}>
        {rb.cmds.map((c, i) => {
          const s = i === rb.at ? (rb.block ? "blocked" : "now") : i < rb.done ? "done" : "todo";
          return (
            <span key={i} className="algo-sim-cmd" data-s={s}>
              {c}
            </span>
          );
        })}
      </p>

      <div
        className="algo-grid"
        style={{ gridTemplateColumns: `repeat(${rb.cols}, minmax(0, 36px))` }}
        role="img"
        aria-label={`${rb.rows}×${rb.cols} 방. 로봇은 ${rb.r}행 ${rb.c}열에서 ${DIR_OBJ[rb.d]} 봄`}
      >
        {rb.walls.map((wall, i) => (
          <span
            key={i}
            className="algo-gcell algo-sim-cell"
            data-kind={wall ? "wall" : "floor"}
            data-robot={i === here ? "" : undefined}
            data-trail={trail.has(i) && i !== here ? "" : undefined}
            data-ahead={i === rb.ahead ? "" : undefined}
            data-blocked={i === rb.ahead && rb.block ? "" : undefined}
          >
            {i === here ? ARROWS[rb.d] : wall ? "벽" : trail.has(i) ? "·" : ""}
          </span>
        ))}
      </div>

      <p className="algo-sim-facing">
        로봇 ({rb.r}, {rb.c}) 칸 · {ARROWS[rb.d]} {DIR_OBJ[rb.d]} 봄
        {rb.block === "edge" && <b> · 앞은 방 바깥이라 못 감</b>}
      </p>
    </div>
  );
}
