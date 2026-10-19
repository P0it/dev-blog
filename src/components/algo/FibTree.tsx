import { fibTree, countOf, type FibNode } from "@/lib/algo/recursion";

type Placed = { n: number; x: number; y: number; id: number; parent: number | null };

/**
 * 자기를 두 번 부르는 재귀의 호출 나무 — 정적 그림 한 컷.
 *
 * 호출 탑(한 줄로 쌓임)과 달리 호출이 둘로 갈라진다. 같은 계산을 되풀이하는 노드는 색을 달리한다.
 * 클라이언트 상태가 없어 서버에서 그린다.
 */
export function FibTree({ n }: { n: number }) {
  const root = fibTree(n);
  const placed: Placed[] = [];
  let leaf = 0;
  let id = 0;

  const place = (node: FibNode, depth: number, parent: number | null): { x: number; id: number } => {
    const myId = id++;
    const slot: Placed = { n: node.n, x: 0, y: depth, id: myId, parent };
    placed.push(slot);
    if (node.kids.length === 0) {
      slot.x = leaf++;
    } else {
      const xs = node.kids.map((k) => place(k, depth + 1, myId).x);
      slot.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    return { x: slot.x, id: myId };
  };
  place(root, 0, null);

  const maxDepth = Math.max(...placed.map((p) => p.y));
  const W = 104;
  const px = (p: Placed) => 36 + p.x * W;
  const py = (p: Placed) => 24 + p.y * 56;
  const width = 36 * 2 + (leaf - 1) * W;
  const height = 24 * 2 + maxDepth * 56;
  const byId = new Map(placed.map((p) => [p.id, p]));

  return (
    <figure className="algo-fib">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`fib(${n}) 호출 나무. 호출 ${placed.length}번, fib(2) 를 ${countOf(root, 2)}번 되풀이한다`}
      >
        {placed
          .filter((p) => p.parent !== null)
          .map((p) => {
            const q = byId.get(p.parent!)!;
            return <line key={`e${p.id}`} className="algo-fib-edge" x1={px(q)} y1={py(q)} x2={px(p)} y2={py(p)} />;
          })}
        {placed.map((p) => {
          const rep = p.n >= 2 && countOf(root, p.n) > 1 && p.n !== n;
          return (
            <g key={p.id} className={`algo-fib-node${rep ? " rep" : ""}`}>
              <rect x={px(p) - 28} y={py(p) - 14} width={56} height={28} rx={8} />
              <text x={px(p)} y={py(p)}>
                fib({p.n})
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        호출 {placed.length}번. 색이 다른 <b>fib(2)</b> 는 같은 계산을 {countOf(root, 2)}번 되풀이한 것입니다.
      </figcaption>
    </figure>
  );
}
