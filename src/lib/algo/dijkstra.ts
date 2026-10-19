import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 가장 가까운 곳부터 하나씩 확정하는 다익스트라. 큐에는 (거리, 곳) 을 넣고, 꺼낸 거리가 기록보다 크면 낡은 항목이라 건너뛴다.
 * 화면에는 `import heapq` 한 줄을 코드 위에 따로 적는다(이 목록은 def 부터다).
 */
export const DIJK_CODE = [
  "def dijkstra(graph, start):", // 1
  "    dist = {v: float('inf') for v in graph}", // 2
  "    dist[start] = 0", // 3
  "    heap = [(0, start)]", // 4
  "    while heap:", // 5
  "        d, u = heapq.heappop(heap)", // 6
  "        if d > dist[u]:", // 7
  "            continue", // 8
  "        for v, w in graph[u]:", // 9
  "            if d + w < dist[v]:", // 10
  "                dist[v] = d + w", // 11
  "                heapq.heappush(heap, (d + w, v))", // 12
  "    return dist", // 13
];

/** 곳마다 이어진 길 `[이웃, 걸리는 시간(분)]`. 이웃을 적은 순서가 곧 훑는 순서다. */
export type Graph = Record<string, [string, number][]>;

/**
 * ① 해 보기와 ④ 플레이어가 함께 쓰는 지도. 출발지 S, 가게 A~E. 걸음 수가 적은 길이 더 오래 걸리게 짰다 —
 * S→B 직행은 5분이지만 S→A→B 는 3분이다.
 */
export const GRAPH: Graph = {
  S: [["A", 2], ["B", 5]],
  A: [["S", 2], ["B", 1], ["C", 5]],
  B: [["S", 5], ["A", 1], ["D", 2]],
  C: [["A", 5], ["E", 3]],
  D: [["B", 2], ["E", 1]],
  E: [["C", 3], ["D", 1]],
};
export const NAMES = Object.keys(GRAPH);
export const START = "S";
export const TARGET = "E";

// 곳 이름 뒤 조사: 이 지도의 이름 S·A·B·C·D·E 는 읽을 때 모두 모음으로 끝나(에스·에이·비·씨·디·이) 받침이 없다.
// 그래서 노트에서는 `를`·`는`·`가`·`와` 를 그대로 쓴다.

/** 그림에 그릴 길 — 양쪽을 한 번씩만. `[곳 번호, 곳 번호, 분]` */
export const EDGES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  NAMES.forEach((n, i) => {
    for (const [m, w] of GRAPH[n]) {
      const j = NAMES.indexOf(m);
      if (j > i) out.push([i, j, w]);
    }
  });
  return out;
})();

type Entry = [number, string];
const cmpEntry = (a: Entry, b: Entry): number => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);

const toNull = (x: number): number | null => (x === Infinity ? null : x);

/** 그림 한 장. 확정한 곳은 settled, 방금 다루는 곳은 current, 견주는 이웃은 compare, 길은 알지만 아직 확정 전이면 waiting. */
function stageOf(
  names: string[],
  dist: number[],
  confirmed: boolean[],
  heap: Entry[],
  now?: number,
  look?: number,
  changed?: number[],
): StageState {
  const cells: CellState[] = names.map((_, i) => {
    if (i === look) return "compare";
    if (i === now) return "current";
    if (confirmed[i]) return "settled";
    return dist[i] !== Infinity ? "waiting" : "out";
  });
  const queue = [...heap].sort(cmpEntry).map(([d, n]) => [d, names.indexOf(n)] as [number, number]);
  return {
    cells,
    flags: {},
    graph: { dist: dist.map(toNull), confirmed: [...confirmed], now, look, changed, queue },
  };
}

/**
 * 테이프는 while·for 머리줄(5·9번)과 `if d > dist[u]`(7번)를 스텝으로 올리지 않는다.
 * 다 올리면 70스텝이 넘어 연타로 끝난다. 7번은 낡은 항목일 때만 8번 줄로 보인다.
 */
function* walk(graph: Graph, start: string): Generator<Step> {
  const names = Object.keys(graph);
  const idx = (n: string) => names.indexOf(n);
  const dist = names.map(() => Infinity);
  const confirmed = names.map(() => false);
  dist[idx(start)] = 0;
  const heap: Entry[] = [[0, start]];

  yield {
    line: 4,
    vars: {},
    stage: stageOf(names, dist, confirmed, heap),
    note: `거리표를 만듭니다. 출발지 ${start}는 0분, 나머지는 아직 모릅니다(∞). 큐에는 (0, ${start}) 하나뿐입니다`,
  };

  while (heap.length > 0) {
    heap.sort(cmpEntry);
    const [d, u] = heap.shift() as Entry;
    const ui = idx(u);
    const stale = d > dist[ui];
    if (!stale) confirmed[ui] = true;

    yield {
      line: 6,
      vars: { d },
      stage: stageOf(names, dist, confirmed, heap, ui),
      note: stale
        ? `큐에서 (${d}, ${u})를 꺼냈습니다`
        : `큐에서 가장 작은 (${d}, ${u})를 꺼냈습니다. ${u}까지 ${d}분이 확정됩니다`,
    };

    if (stale) {
      yield {
        line: 8,
        vars: { d },
        stage: stageOf(names, dist, confirmed, heap, ui),
        note: `${d}분은 ${u}의 지금 기록 ${dist[ui]}분보다 큽니다. 낡은 항목이라 건너뜁니다`,
      };
      continue;
    }

    for (const [v, w] of graph[u]) {
      const vi = idx(v);
      const nd = d + w;
      const rec = dist[vi] === Infinity ? "∞" : `${dist[vi]}분`;
      const better = nd < dist[vi];
      const vars: Record<string, number> = { d, w, "d + w": nd };
      if (dist[vi] !== Infinity) vars["dist[v]"] = dist[vi];

      yield {
        line: 10,
        vars,
        stage: stageOf(names, dist, confirmed, heap, ui, vi),
        note: `${u}에서 ${v}까지 길은 ${w}분. ${d} + ${w} = ${nd}분을 지금 기록(${rec})과 견줍니다. ${
          better ? "더 짧습니다" : "더 짧지 않아 그대로 둡니다"
        }`,
      };
      if (!better) continue;

      dist[vi] = nd;
      yield {
        line: 11,
        vars: { d, w, "d + w": nd },
        stage: stageOf(names, dist, confirmed, heap, ui, vi, [vi]),
        note: `${v}까지 ${nd}분으로 고칩니다`,
      };

      heap.push([nd, v]);
      yield {
        line: 12,
        vars: { d, w, "d + w": nd },
        stage: stageOf(names, dist, confirmed, heap, ui, vi, [vi]),
        note: `큐에 (${nd}, ${v})를 넣습니다`,
      };
    }
  }

  yield {
    line: 13,
    vars: {},
    stage: stageOf(names, dist, confirmed, heap),
    note: `큐가 비었습니다. ${start}에서 각 곳까지 가장 빠른 시간이 정해졌습니다`,
    done: true,
  };
}

export function dijkstraTape(graph: Graph = GRAPH, start: string = START): Tape {
  return buildTape(walk(graph, start), DIJK_CODE);
}

// ── ① 해 보기: 가장 가까운 곳부터 눌러 확정 ──

/** 손으로 하는 한 판의 상태. `dist` 의 null 은 아직 가는 길을 모르는 곳(∞). */
export type HandState = {
  dist: (number | null)[];
  confirmed: boolean[];
  /** 방금 확정한 곳 */
  now?: number;
  /** 방금 거리가 고쳐진 곳 */
  changed: number[];
};

export function initialState(graph: Graph = GRAPH, start: string = START): HandState {
  const names = Object.keys(graph);
  return {
    dist: names.map((n) => (n === start ? 0 : null)),
    confirmed: names.map(() => false),
    changed: [],
  };
}

/** 아직 확정하지 않은 곳 중 가는 길을 아는 곳에서 가장 가까운 곳. 없으면 null. */
export function closestCandidate(state: HandState): { idx: number; d: number } | null {
  let best: { idx: number; d: number } | null = null;
  state.dist.forEach((d, idx) => {
    if (d === null || state.confirmed[idx]) return;
    if (best === null || d < best.d) best = { idx, d };
  });
  return best;
}

export type PickCheck =
  | { ok: true }
  | { ok: false; reason: "done" }
  | { ok: false; reason: "unknown" }
  | { ok: false; reason: "farther"; closest: { idx: number; d: number } };

/** `i` 번 곳을 확정해도 되는가. 허용 동작은 알고리즘의 동작 — 가장 가까운 곳만 확정한다. */
export function pickCheck(state: HandState, i: number): PickCheck {
  if (state.confirmed[i]) return { ok: false, reason: "done" };
  const d = state.dist[i];
  if (d === null) return { ok: false, reason: "unknown" };
  const closest = closestCandidate(state);
  if (closest !== null && d > closest.d) return { ok: false, reason: "farther", closest };
  return { ok: true };
}

/** `i` 번 곳을 확정하고, 확정 안 된 이웃의 시간을 **더 짧을 때만** 고친다. */
export function confirmNode(
  state: HandState,
  i: number,
  graph: Graph = GRAPH,
): { state: HandState; changes: { to: number; from: number | null; time: number }[] } {
  const names = Object.keys(graph);
  const dist = [...state.dist];
  const confirmed = [...state.confirmed];
  confirmed[i] = true;
  const base = dist[i] as number;
  const changes: { to: number; from: number | null; time: number }[] = [];
  for (const [m, w] of graph[names[i]]) {
    const j = names.indexOf(m);
    if (confirmed[j]) continue;
    const t = base + w;
    if (dist[j] === null || t < (dist[j] as number)) {
      changes.push({ to: j, from: dist[j], time: t });
      dist[j] = t;
    }
  }
  return { state: { dist, confirmed, now: i, changed: changes.map((c) => c.to) }, changes };
}

/** 손으로 하는 판의 그림. 큐는 없다(① 에서는 보이지 않는다). */
export function stageFromHand(state: HandState, graph: Graph = GRAPH): StageState {
  const names = Object.keys(graph);
  const cells: CellState[] = names.map((_, i) => {
    if (i === state.now) return "current";
    if (state.confirmed[i]) return "settled";
    return state.dist[i] !== null ? "waiting" : "out";
  });
  return {
    cells,
    flags: {},
    graph: {
      dist: [...state.dist],
      confirmed: [...state.confirmed],
      now: state.now,
      changed: state.changed,
      queue: [],
    },
  };
}

// ── ② 되짚기: 걸음 수와 시간 ──

type PathInfo = { names: string[]; time: number; hops: number };

function allPaths(graph: Graph, start: string, target: string): PathInfo[] {
  const out: PathInfo[] = [];
  const walkPath = (at: string, path: string[], time: number) => {
    if (at === target) {
      out.push({ names: path, time, hops: path.length - 1 });
      return;
    }
    for (const [m, w] of graph[at]) if (!path.includes(m)) walkPath(m, [...path, m], time + w);
  };
  walkPath(start, [start], 0);
  return out;
}

/** 거치는 길 수(걸음)가 가장 적은 길들과 그 시간(빠른 순). */
export function fewestHops(graph: Graph, start: string, target: string): { hops: number; paths: { names: string[]; time: number }[] } {
  const all = allPaths(graph, start, target);
  const hops = Math.min(...all.map((p) => p.hops));
  const paths = all
    .filter((p) => p.hops === hops)
    .map((p) => ({ names: p.names, time: p.time }))
    .sort((a, b) => a.time - b.time);
  return { hops, paths };
}

/** 시간이 가장 짧은 길. */
export function fastestPath(graph: Graph, start: string, target: string): PathInfo {
  const all = allPaths(graph, start, target);
  return all.reduce((best, p) => (p.time < best.time || (p.time === best.time && p.hops < best.hops) ? p : best));
}

// ── ⑤·⑥ 확인 문제와 틀리는 자리 ──

/** 두 곳 사이 길의 시간을 양쪽 모두 `w` 로 바꾼 새 지도. */
export function setWeight(graph: Graph, a: string, b: string, w: number): Graph {
  const out: Graph = {};
  for (const [n, es] of Object.entries(graph)) {
    out[n] = es.map(([m, x]) => [m, (n === a && m === b) || (n === b && m === a) ? w : x]);
  }
  return out;
}

export type VariantOptions = {
  /** `if d > dist[u]: continue` 가 있는가 */
  staleCheck?: boolean;
  /** 큐에 (곳, 거리) 순서로 넣는가 — 꺼내는 차례가 곳 이름순이 된다 */
  nodeFirst?: boolean;
  /** 거리를 ∞ 가 아니라 0 으로 시작하는가 */
  initZero?: boolean;
  /** 꺼내는 횟수 상한. 끝나지 않는 입력을 끊는다 */
  limit?: number;
};

export type VariantResult = {
  dist: Record<string, number>;
  pops: number;
  checks: number;
  updates: number;
  stales: number;
  hitLimit: boolean;
};

/** 코드를 조금씩 바꿔 돌린 결과. 실제 Python 으로 확인한 값과 같은지 테스트가 대조한다. */
export function runVariant(graph: Graph, start: string, opt: VariantOptions = {}): VariantResult {
  const { staleCheck = true, nodeFirst = false, initZero = false, limit = 100000 } = opt;
  const dist: Record<string, number> = {};
  for (const n of Object.keys(graph)) dist[n] = initZero ? 0 : Infinity;
  dist[start] = 0;

  // 큐 항목은 {d, v}. 거리 먼저면 (d, v) 순, 곳 먼저면 (v, d) 순으로 견준다.
  type Item = { d: number; v: string };
  const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const cmp = nodeFirst
    ? (a: Item, b: Item) => cmpStr(a.v, b.v) || a.d - b.d
    : (a: Item, b: Item) => a.d - b.d || cmpStr(a.v, b.v);
  const heap: Item[] = [{ d: 0, v: start }];
  let pops = 0;
  let checks = 0;
  let updates = 0;
  let stales = 0;

  while (heap.length > 0 && pops < limit) {
    heap.sort(cmp);
    const { d, v: u } = heap.shift() as Item;
    pops++;
    if (staleCheck && d > dist[u]) {
      stales++;
      continue;
    }
    for (const [v, w] of graph[u]) {
      checks++;
      if (d + w < dist[v]) {
        dist[v] = d + w;
        updates++;
        heap.push({ d: d + w, v });
      }
    }
  }
  return { dist, pops, checks, updates, stales, hitLimit: heap.length > 0 && pops >= limit };
}

/** 각 곳까지 가장 빠른 시간. */
export function shortestTimes(graph: Graph, start: string): Record<string, number> {
  return runVariant(graph, start, {}).dist;
}

/** 가장 가까운 곳부터 눌러 도착지를 확정할 때까지의 순서와 시간. ① 에서 독자가 밟는 길이 이것이다. */
export function handOrder(graph: Graph = GRAPH, start: string = START, target: string = TARGET): { name: string; time: number }[] {
  const names = Object.keys(graph);
  let state = initialState(graph, start);
  const out: { name: string; time: number }[] = [];
  for (;;) {
    const c = closestCandidate(state);
    if (c === null) break;
    out.push({ name: names[c.idx], time: c.d });
    state = confirmNode(state, c.idx, graph).state;
    if (names[c.idx] === target) break;
  }
  return out;
}
