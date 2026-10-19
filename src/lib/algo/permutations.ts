import type { StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/** 줄 서는 친구들. ① 해 보기와 ④ 플레이어가 같은 입력을 쓴다 — ① 의 깨달음이 ④ 로 이어진다. */
export const PERM_ITEMS = ["A", "B", "C"];

/**
 * 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다.
 * 줄 이름: 8·9 는 친구를 세우기(choose), 10 은 다음 자리로 들어가기(recurse), 11·12 는 되돌리기(unchoose).
 */
export const PERM_CODE = [
  "def permute(items, path, used, result):", // 1
  "    if len(path) == len(items):", // 2
  "        result.append(path[:])", // 3
  "        return", // 4
  "    for i in range(len(items)):", // 5
  "        if used[i]:", // 6
  "            continue", // 7
  "        used[i] = True", // 8
  "        path.append(items[i])", // 9
  "        permute(items, path, used, result)", // 10
  "        path.pop()", // 11
  "        used[i] = False", // 12
];

/**
 * 플레이어가 올리는 줄. 줄 이벤트를 모두 올리면 150 스텝이 넘어 연타로 끝난다.
 * 4(자리가 다 참 → 결과에 담고 돌아감), 10(친구를 세우고 다음 자리로), 12(마지막 자리를 비움) 만 올린다.
 * 맨 처음 스텝(2번 줄)은 아무도 안 선 모습이다.
 */
export const PERM_KEPT_LINES = [4, 10, 12];

/** 이 스텝이 그리는 모습. 필드 뜻은 `StageState.perm` 에 적었다. */
export type PermStage = NonNullable<StageState["perm"]>;

/** 영문 한 글자 뒤 조사. 읽는 소리 끝에 받침이 있는 L M N R 만 받침 있는 쪽이다. */
export function letterJosa(name: string, withBatchim: string, withoutBatchim: string): string {
  const last = name.slice(-1).toUpperCase();
  return `${name}${"LMNR".includes(last) ? withBatchim : withoutBatchim}`;
}

function snap(
  line: number,
  stage: PermStage,
  note: string,
  i: number | undefined,
  done?: boolean,
): Step {
  const vars: Record<string, number> = {};
  if (i !== undefined) vars.i = i;
  vars["len(path)"] = stage.path.length;
  vars["len(result)"] = stage.result.length;
  return {
    line,
    vars,
    stage: {
      cells: [],
      flags: {},
      perm: { ...stage, path: [...stage.path], used: [...stage.used], result: [...stage.result] },
    },
    note,
    ...(done ? { done } : {}),
  };
}

const word = (items: string[], path: number[]) => path.map((k) => items[k]).join("");

/**
 * Python 과 스텝이 맞물리게 흘린다. 스텝의 그림은 그 줄을 **실행한 뒤**의 모습이고,
 * 줄 번호와 변수 `i` 는 그 줄이 있는 호출의 것이다. 어긋나면 fixture 대조 테스트가 잡는다.
 */
function* walk(items: string[]): Generator<Step> {
  const n = items.length;
  const path: number[] = [];
  const used: boolean[] = items.map(() => false);
  const result: string[] = [];
  const stage = (mode: PermStage["mode"], i?: number): PermStage => ({
    items,
    path,
    used,
    result,
    mode,
    ...(i !== undefined ? { i } : {}),
  });

  yield snap(
    2,
    stage("start"),
    n === 0 ? "줄 설 친구가 없습니다. 빈 줄 하나가 곧 결과입니다" : `${n}자리가 모두 비어 있습니다. 앞자리부터 하나씩 정합니다`,
    undefined,
  );

  function* dfs(depth: number): Generator<Step> {
    if (path.length === n) {
      result.push(word(items, path));
      yield snap(
        4,
        stage("found"),
        `자리가 다 찼습니다. ${word(items, path) || "빈 줄"} 한 가지를 결과에 담고 되돌아갑니다 (${result.length}가지째)`,
        undefined,
        depth === 0, // 친구가 없으면 이 한 걸음으로 끝난다
      );
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(i);
      yield snap(
        10,
        stage("choose", i),
        `${path.length}번째 자리에 ${letterJosa(items[i], "을", "를")} 세웠습니다. 다음 자리로 들어갑니다`,
        i,
      );
      yield* dfs(depth + 1);
      path.pop();
      used[i] = false;
      const last = depth === 0 && i === n - 1; // 첫 자리에 설 수 있는 친구를 마지막 번호까지 다 해 봤다
      yield snap(
        12,
        stage(last ? "done" : "undo", i),
        last
          ? `첫 자리에 설 수 있는 친구를 모두 해 봤습니다. 순서는 모두 ${result.length}가지입니다`
          : `${depth + 1}번째 자리의 ${letterJosa(items[i], "을", "를")} 뺐습니다. ${
              // 반복문은 번호가 큰 쪽으로만 이어 간다 — 뒤에 남은 친구가 없으면 이 자리는 끝이고 한 칸 더 되돌아간다
              items.some((_, j) => j > i && !used[j]) ? "이제 다른 친구를 고를 수 있습니다" : "이 자리에 올 다른 친구가 없어 한 칸 더 되돌아갑니다"
            }`,
        i,
        last,
      );
    }
  }

  yield* dfs(0);
}

export function permuteTape(items: string[] = PERM_ITEMS): Tape {
  return buildTape(walk(items), PERM_CODE);
}

/** 모든 순서(순열)를 글자로. 알고리즘이 찾는 차례 그대로다. */
export function permutationsOf(items: string[]): string[] {
  const out: string[] = [];
  const used = items.map(() => false);
  const path: number[] = [];
  const go = () => {
    if (path.length === items.length) {
      out.push(word(items, path));
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(i);
      go();
      path.pop();
      used[i] = false;
    }
  };
  go();
  return out;
}

/** 순서를 따지지 않고 `k` 명을 뽑는 모든 경우(조합). 이름 순서대로 앞에서부터 고른다. */
export function combinationsOf(items: string[], k: number): string[] {
  const out: string[] = [];
  const go = (start: number, picked: string[]) => {
    if (picked.length === k) {
      out.push(picked.join(""));
      return;
    }
    for (let i = start; i < items.length; i++) go(i + 1, [...picked, items[i]]);
  };
  go(0, []);
  return out;
}

/** n! */
export function factorial(n: number): number {
  let f = 1;
  for (let k = 2; k <= n; k++) f *= k;
  return f;
}

/** n 명 중 순서 있게 k 명을 세우는 경우의 수 = n! / (n−k)! */
export function countPerm(n: number, k: number = n): number {
  let c = 1;
  for (let m = n; m > n - k; m--) c *= m;
  return c;
}

/** n 명 중 순서 없이 k 명을 뽑는 경우의 수 */
export function countComb(n: number, k: number): number {
  return countPerm(n, k) / factorial(k);
}

/** 가장 먼저 되돌리는 스텝(자리가 다 찬 직후 마지막 친구를 빼는 순간)의 번호. 예측 관문 자리다. */
export function firstUndoGate(tape: Tape): number {
  return tape.steps.findIndex((s) => s.line === 12);
}
