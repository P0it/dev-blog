import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 힙에 값을 넣는 코드(sift-up). 맨 끝에 앉힌 뒤 부모보다 작으면 자리를 바꿔 올라간다. */
export const HEAP_CODE = [
  "def push(heap, x):", // 1
  "    heap.append(x)", // 2
  "    i = len(heap) - 1", // 3
  "    while i > 0:", // 4
  "        p = (i - 1) // 2", // 5
  "        if heap[p] <= heap[i]:", // 6
  "            break", // 7
  "        heap[p], heap[i] = heap[i], heap[p]", // 8
  "        i = p", // 9
  "    return heap", // 10
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 접수대. 숫자가 작을수록 급하고, 위 칸은 늘 아래 칸보다 급하다. */
export const WARD = [2, 5, 3, 9, 6, 8];
/** 맨 아래 빈자리에 새로 앉는 환자. */
export const NEWCOMER = 1;

/** 칸 번호 `i` 의 부모 칸. 0번이 맨 위다. */
export function parentOf(i: number): number {
  return (i - 1) >> 1;
}

/** 부모가 자식보다 늘 같거나 작으면 힙이다. */
export function isHeap(a: readonly number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[parentOf(i)] > a[i]) return false;
  return true;
}

/** `i` 칸의 환자가 부모보다 급해서(숫자가 더 작아서) 올라가야 하는가. */
export function shouldRise(heap: readonly number[], i: number): boolean {
  return i > 0 && heap[parentOf(i)] > heap[i];
}

/**
 * 올라가기 한 번. 부모보다 급하면 자리를 바꿔 한 칸 올라가고(`swapped`), 아니면 그대로다.
 * 원래 배열은 건드리지 않는다.
 */
export function riseStep(heap: readonly number[], i: number): { heap: number[]; i: number; swapped: boolean } {
  const next = [...heap];
  if (!shouldRise(next, i)) return { heap: next, i, swapped: false };
  const p = parentOf(i);
  [next[p], next[i]] = [next[i], next[p]];
  return { heap: next, i: p, swapped: true };
}

/** `x` 를 넣었을 때 몇 칸 올라가는가. */
export function pushRises(heap: readonly number[], x: number): number {
  let h = [...heap, x];
  let i = h.length - 1;
  let ups = 0;
  while (shouldRise(h, i)) {
    const r = riseStep(h, i);
    h = r.heap;
    i = r.i;
    ups++;
  }
  return ups;
}

/** `x` 를 넣은 뒤의 배열. */
export function pushed(heap: readonly number[], x: number): number[] {
  let h = [...heap, x];
  let i = h.length - 1;
  while (shouldRise(h, i)) {
    const r = riseStep(h, i);
    h = r.heap;
    i = r.i;
  }
  return h;
}

/** 맨 위를 꺼낸다 — 맨 끝 환자를 맨 위에 앉히고, 자식 중 더 급한 쪽과 바꾸며 내려보낸다. */
export function popMin(heap: readonly number[]): { min: number; heap: number[] } {
  const a = [...heap];
  const min = a[0];
  const last = a.pop() as number;
  if (a.length === 0) return { min, heap: a };
  a[0] = last;
  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let m = i;
    if (l < a.length && a[l] < a[m]) m = l;
    if (r < a.length && a[r] < a[m]) m = r;
    if (m === i) break;
    [a[m], a[i]] = [a[i], a[m]];
    i = m;
  }
  return { min, heap: a };
}

/** 노드 `n` 개인 힙에서 맨 아래 환자가 올라갈 수 있는 최대 횟수 = 나무 높이. */
export function treeHeight(n: number): number {
  return n <= 1 ? 0 : Math.floor(Math.log2(n));
}

/**
 * 그림 한 장. 새 환자(지금 올라가는 칸)는 current, 견주는 부모는 compare, 나머지는 out.
 * 다 올라가 멈추면 환자의 칸이 settled 다.
 */
function stage(values: number[], patient: number | null, other: number | null, settled: boolean, flags: Record<string, number>) {
  const cells: CellState[] = values.map((_, k) => {
    if (k === patient) return settled ? "settled" : "current";
    if (k === other) return "compare";
    return "out";
  });
  return { cells, flags, values: [...values] };
}

function* walk(initial: number[], x: number): Generator<Step> {
  const heap = [...initial];
  let i: number | null = null;
  let p: number | null = null;
  let ups = 0;

  const vars = (): Record<string, number> => {
    const v: Record<string, number> = { x };
    if (i !== null) v.i = i;
    if (p !== null) v.p = p;
    return v;
  };
  const flags = (): Record<string, number> => {
    const f: Record<string, number> = {};
    if (i !== null) f.i = i;
    if (p !== null) f.p = p;
    return f;
  };
  const at = (line: number, note: string, patient: number | null, other: number | null, extra: Partial<Step> = {}, settled = false): Step => ({
    line,
    vars: vars(),
    stage: stage(heap, patient, other, settled, flags()),
    note,
    ...extra,
  });

  heap.push(x);
  yield at(2, `새 환자 ${josa(x, "을", "를")} 맨 끝자리 ${heap.length - 1}번에 앉힙니다`, heap.length - 1, null);

  i = heap.length - 1;
  yield at(3, `새 환자의 자리 i 는 ${i}번입니다`, i, null);

  for (;;) {
    yield at(
      4,
      i > 0 ? "맨 위(0번)가 아니라서 부모를 봅니다" : "맨 위에 닿았습니다. 더 올라갈 곳이 없습니다",
      i,
      null,
    );
    if (!(i > 0)) break;

    p = parentOf(i);
    yield at(5, `부모 자리는 (${i} − 1) // 2 = ${p}번입니다`, i, p);

    yield at(6, `부모 ${josa(heap[p], "과", "와")} 새 환자 ${josa(heap[i], "을", "를")} 견줍니다`, i, p);
    if (heap[p] <= heap[i]) {
      yield at(7, "부모가 같거나 더 급합니다. 여기서 멈춥니다", i, p);
      break;
    }

    [heap[p], heap[i]] = [heap[i], heap[p]];
    ups++;
    // 바꾼 직후: 새 환자는 부모 자리(p)에 있고, 밀려난 부모는 i 에 있다
    yield at(8, `부모 ${josa(heap[i], "과", "와")} 자리를 바꿉니다`, p, i);

    i = p;
    yield at(9, `새 환자의 자리 i 가 ${i}번이 됩니다`, i, null);
  }

  yield at(
    10,
    `${i}번 자리에 앉았습니다. ${ups}번 올라갔습니다`,
    i,
    null,
    { done: true },
    true,
  );
}

export function heapTape(initial: number[], x: number): Tape {
  return buildTape(walk(initial, x), HEAP_CODE);
}
