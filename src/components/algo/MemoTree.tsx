import type { MemoNode, NodeState } from "@/lib/algo/memoization";
import { fibValue } from "@/lib/algo/memoization";

const W = 66; // 잎 하나의 가로 폭
const H = 56; // 층 사이 높이
const PAD = 38;
const BOX_W = 58;
const BOX_H = 38;

/**
 * 호출 나무 — 부른 호출이 위에서부터 칠해진다.
 *
 * 다음에 처리할 호출은 테두리가 두껍다. 계산한 호출은 초록으로 값이 보이고, 수첩에서 꺼내 쓴 호출은 파랑으로 값이 보인다.
 * 꺼내 쓴 호출의 아래 가지는 부르지 않으므로 흐리게 접힌다. 클라이언트 상태가 없어 부모(`MemoByHand`)가 상태를 넘긴다.
 */
export function MemoTree({
  nodes,
  states,
  nextId,
  label,
}: {
  nodes: MemoNode[];
  states: NodeState[];
  nextId: number | null;
  label: string;
}) {
  const maxX = Math.max(...nodes.map((x) => x.x));
  const maxDepth = Math.max(...nodes.map((x) => x.depth));
  const width = PAD * 2 + maxX * W;
  const height = 24 + maxDepth * H + BOX_H;
  const px = (x: MemoNode) => PAD + x.x * W;
  const py = (x: MemoNode) => 12 + BOX_H / 2 + x.depth * H;

  return (
    <svg className="algo-memo-tree" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {nodes
        .filter((x) => x.parent !== null)
        .map((x) => {
          const q = nodes[x.parent!];
          return (
            <line
              key={`e${x.id}`}
              className="algo-memo-edge"
              data-skipped={states[x.id] === "skipped"}
              x1={px(q)}
              y1={py(q) + BOX_H / 2}
              x2={px(x)}
              y2={py(x) - BOX_H / 2}
            />
          );
        })}
      {nodes.map((x) => {
        const st = states[x.id];
        const next = x.id === nextId;
        const showValue = st === "done" || st === "hit";
        return (
          <g key={x.id} className="algo-memo-node" data-state={next ? "next" : st}>
            <rect x={px(x) - BOX_W / 2} y={py(x) - BOX_H / 2} width={BOX_W} height={BOX_H} rx={9} />
            <text className="algo-memo-node-label" x={px(x)} y={py(x) - 6}>
              fib({x.n})
            </text>
            <text className="algo-memo-node-value" x={px(x)} y={py(x) + 10}>
              {showValue ? `= ${fibValue(x.n)}` : "?"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
