import type { StageState } from "@/lib/algo/types";
import { AXIS } from "@/lib/algo/activity-selection";

const SPAN = AXIS.to - AXIS.from;
const pct = (h: number) => `${((h - AXIS.from) / SPAN) * 100}%`;
const HOURS = Array.from({ length: SPAN + 1 }, (_, k) => AXIS.from + k);

/**
 * 시간표 무대 — 회의 하나가 한 줄이고, 줄 안의 막대가 그 회의가 차지하는 시간이다.
 *
 * 고른 회의는 초록, 지금 보는 회의는 파랑, 건너뛴 회의는 점선으로 흐리게, 아직 안 본 회의는 흰색이다.
 * 노란 세로 선은 지금까지 고른 회의 가운데 가장 늦은 끝 시각이다 — 다음 회의가 이 선 오른쪽에서 시작해야 겹치지 않는다.
 * `onPick` 을 주면 줄을 눌러 볼 수 있다(① 해 보기). `flash` 는 방금 겹쳐서 못 고른 줄이다.
 * 상태 없이 서버에서 그려도 되는 순수 표시 컴포넌트다.
 */
export function StageTimeline({
  state,
  onPick,
  flash,
}: {
  state: StageState;
  onPick?: (i: number) => void;
  flash?: number[];
}) {
  const t = state.timeline;
  if (!t) return null;

  const label = t.rows
    .map((r, i) => `${r.name} ${r.s}시부터 ${r.e}시까지 ${stateText(state.cells[i])}`)
    .join(", ");

  return (
    <div className="algo-meet" role="img" aria-label={`시간표. ${label}`} style={{ ["--cols" as string]: SPAN }}>
      <div className="algo-meet-axis" aria-hidden="true">
        <div />
        <div>
          {HOURS.map((h) => (
            <span key={h} style={{ left: pct(h) }}>
              {h}
            </span>
          ))}
        </div>
      </div>

      {t.rows.map((r, i) => {
        const s = state.cells[i] ?? "out";
        const bar = (
          <>
            <span className="algo-meet-name">
              <b>{r.name}</b>
              <em>
                {r.s}~{r.e}시
              </em>
            </span>
            <span className="algo-meet-track">
              <i className="algo-meet-bar" style={{ left: pct(r.s), width: `max(6px, calc(${pct(r.e)} - ${pct(r.s)}))` }} />
              {t.end !== undefined && <i className="algo-meet-end" style={{ left: pct(t.end) }} />}
            </span>
          </>
        );
        const common = { className: "algo-meet-row", "data-s": s, "data-flash": flash?.includes(i) || undefined };
        if (!onPick) {
          return (
            <div key={r.name} {...common}>
              {bar}
            </div>
          );
        }
        return (
          <button
            key={r.name}
            type="button"
            {...common}
            aria-pressed={s === "settled"}
            onClick={() => onPick(i)}
          >
            {bar}
          </button>
        );
      })}
    </div>
  );
}

function stateText(s: string | undefined): string {
  if (s === "settled") return "고름";
  if (s === "current") return "지금 보는 중";
  if (s === "dropped") return "건너뜀";
  return "아직";
}
