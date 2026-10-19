import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 정렬된 카드에서 합이 target 인 두 장이 있는지 양끝에서 좁혀 오며 찾는 코드. */
export const PAIR_CODE = [
  "def has_pair(arr, target):", // 1
  "    left, right = 0, len(arr) - 1", // 2
  "    while left < right:", // 3
  "        total = arr[left] + arr[right]", // 4
  "        if total == target:", // 5
  "            return True", // 6
  "        elif total < target:", // 7
  "            left += 1", // 8
  "        else:", // 9
  "            right -= 1", // 10
  "    return False", // 11
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 카드. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const PAIR_CARDS = [1, 3, 4, 6, 8, 10, 13];
export const PAIR_TARGET = 13;

/**
 * 그림 한 장. 버린 카드는 dropped, 왼쪽 끝은 current, 오른쪽 끝은 compare.
 * `hit` 이면 찾은 두 장이 settled 다.
 */
function stage(arr: number[], left: number, right: number, hit: boolean) {
  const cells: CellState[] = arr.map((_, k) => {
    if (k < left || k > right) return "dropped";
    if (hit && (k === left || k === right)) return "settled";
    if (k === left) return "current";
    if (k === right) return "compare";
    return "out";
  });
  return { cells, flags: { left, right }, values: [...arr] };
}

type Vars = { left: number | null; right: number | null; total: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(s: Vars): Record<string, number> {
  const out: Record<string, number> = {};
  if (s.left !== null) out.left = s.left;
  if (s.right !== null) out.right = s.right;
  if (s.total !== null) out.total = s.total;
  return out;
}

function* walk(arr: number[], target: number): Generator<Step> {
  const n = arr.length;
  const s: Vars = { left: null, right: null, total: null };
  const at = (line: number, note: string, hit = false, done?: boolean): Step => ({
    line,
    vars: vars(s),
    // 끝났거나 비었을 때 left/right 가 범위를 벗어나도 그림은 안전하게 그린다
    stage: stage(arr, s.left ?? 0, s.right ?? n - 1, hit),
    note,
    ...(done === undefined ? {} : { done }),
  });

  s.left = 0;
  s.right = n - 1;
  yield at(
    2,
    n === 0 ? "카드가 한 장도 없습니다" : `양끝에 하나씩 둡니다. left 는 0번, right 는 ${n - 1}번 칸입니다`,
  );

  for (;;) {
    const go = s.left < s.right;
    yield at(3, go ? "left 가 right 보다 작은 동안 되풀이합니다" : "두 끝이 만났습니다. 더 볼 쌍이 없습니다");
    if (!go) break;

    s.total = arr[s.left] + arr[s.right];
    yield at(4, `${arr[s.left]} + ${arr[s.right]} = ${s.total}`);

    const same = s.total === target;
    yield at(5, `합 ${josa(s.total, "은", "는")} 목표 ${josa(target, "과", "와")} 같을까요? ${same ? "같습니다" : "다릅니다"}`);
    if (same) {
      yield at(6, `${josa(arr[s.left], "과", "와")} ${josa(arr[s.right], "을", "를")} 찾았습니다`, true, true);
      return;
    }

    const small = s.total < target;
    yield at(7, small ? `${s.total} < ${josa(target, "이라", "라")} 합이 작습니다` : `${s.total} > ${josa(target, "이라", "라")} 합이 큽니다`);
    if (small) {
      const dropped = arr[s.left];
      s.left++;
      yield at(8, `왼쪽 카드 ${josa(dropped, "은", "는")} 어떤 카드와 짝지어도 작습니다. 버립니다`);
    } else {
      const dropped = arr[s.right];
      s.right--;
      yield at(10, `오른쪽 카드 ${josa(dropped, "은", "는")} 어떤 카드와 짝지어도 큽니다. 버립니다`);
    }
  }

  yield at(PAIR_CODE.length, "쌍을 찾지 못했습니다", false, false);
}

export function pairTape(arr: number[], target: number): Tape {
  return buildTape(walk(arr, target), PAIR_CODE);
}

/** 테이프 없이 답만. 비교용·테스트용. */
export function hasPair(arr: number[], target: number): boolean {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const total = arr[left] + arr[right];
    if (total === target) return true;
    if (total < target) left++;
    else right--;
  }
  return false;
}

/** 합을 몇 번 계산했는가. 모든 쌍은 N(N-1)/2 번인데 이쪽은 아무리 나빠도 N-1 번이다. */
export function pairChecks(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let checks = 0;
  while (left < right) {
    checks++;
    const total = arr[left] + arr[right];
    if (total === target) return checks;
    if (total < target) left++;
    else right--;
  }
  return checks;
}

// ── ① 해 보기 ──

export type Side = "left" | "right";

/** 지금 양끝 카드의 합이 목표보다 큰지, 작은지, 같은지. */
export function judge(arr: number[], left: number, right: number, target: number): "big" | "small" | "hit" {
  const total = arr[left] + arr[right];
  if (total === target) return "hit";
  return total > target ? "big" : "small";
}

/**
 * 독자가 어느 쪽 끝 카드를 버렸을 때의 판정과 이유.
 * ① 에서 허용하는 동작은 알고리즘의 동작뿐이다 — 틀린 쪽을 고르면 되돌리고 **왜 틀렸는지** 말한다.
 */
export function explain(
  arr: number[],
  left: number,
  right: number,
  target: number,
  choice: Side,
): { ok: boolean; text: string } {
  const total = arr[left] + arr[right];
  if (total === target) return { ok: true, text: "합이 목표와 같습니다" };

  if (total > target) {
    if (choice === "right") {
      return {
        ok: true,
        text: `남은 카드 중 가장 작은 ${josa(arr[left], "과", "와")} 더해도 ${josa(total, "이라", "라")} 목표 ${target} 보다 큽니다. ${josa(arr[right], "은", "는")} 어떤 카드와도 짝이 못 되니 버립니다`,
      };
    }
    return {
      ok: false,
      text: `합이 이미 큽니다. 왼쪽 끝은 가장 작은 카드라서 버리면 합이 같거나 더 커집니다. 합을 줄이려면 오른쪽 끝을 버려야 합니다`,
    };
  }

  if (choice === "left") {
    return {
      ok: true,
      text: `남은 카드 중 가장 큰 ${josa(arr[right], "과", "와")} 더해도 ${josa(total, "이라", "라")} 목표 ${target} 보다 작습니다. ${josa(arr[left], "은", "는")} 어떤 카드와도 짝이 못 되니 버립니다`,
    };
  }
  return {
    ok: false,
    text: `합이 아직 작습니다. 오른쪽 끝은 가장 큰 카드라서 버리면 합이 같거나 더 작아집니다. 합을 키우려면 왼쪽 끝을 버려야 합니다`,
  };
}
