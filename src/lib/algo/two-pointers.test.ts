import test from "node:test";
import assert from "node:assert/strict";
import {
  pairTape,
  PAIR_CODE,
  PAIR_CARDS,
  PAIR_TARGET,
  hasPair,
  pairChecks,
  judge,
  explain,
} from "./two-pointers.ts";
import { pairCount } from "./big-o.ts";
import fixture from "./fixtures/two-pointers.json" with { type: "json" };

// fixture 는 scripts/algo/trace_two_pointers.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("PAIR_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PAIR_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = pairTape(c.arr, c.target);
    const mine = t.steps.map((s) => [s.line, s.vars.left ?? null, s.vars.right ?? null, s.vars.total ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("pairTape — 찾으면 done=true, 못 찾으면 done=false 로 끝난다", () => {
  assert.equal(pairTape(PAIR_CARDS, PAIR_TARGET).steps.at(-1)!.done, true);
  assert.equal(pairTape(PAIR_CARDS, 15).steps.at(-1)!.done, false);
});

test("pairTape — 버린 카드는 dropped, 찾은 두 장은 settled 다", () => {
  const t = pairTape(PAIR_CARDS, PAIR_TARGET);
  const last = t.steps.at(-1)!;
  assert.equal(last.stage.cells.filter((c) => c === "settled").length, 2);
  // 첫 합이 14 > 13 이라 오른쪽 끝 13 이 버려진 뒤 스텝
  const afterFirstDrop = t.steps.find((s) => s.line === 10)!;
  assert.equal(afterFirstDrop.stage.cells.at(-1), "dropped");
  assert.equal(afterFirstDrop.stage.cells[0], "current");
});

test("pairTape — 시작 스텝에는 아직 버린 카드가 없다", () => {
  const first = pairTape(PAIR_CARDS, PAIR_TARGET).steps[0];
  assert.ok(first.stage.cells.every((c) => c !== "dropped"));
});

test("pairTape — 모든 스텝의 line 이 코드 범위 안에 있고 7장은 상한 안에 끝난다", () => {
  for (const target of [13, 15, 2, 100]) {
    const t = pairTape(PAIR_CARDS, target);
    for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= PAIR_CODE.length, `line ${s.line} 범위 밖`);
    assert.equal(t.truncated, false);
  }
});

test("pairTape — 빈 배열과 길이 1 에서도 테이프가 생기고 False 로 끝난다", () => {
  for (const arr of [[], [5]]) {
    const last = pairTape(arr, 5).steps.at(-1)!;
    assert.equal(last.done, false);
  }
});

test("hasPair — 정렬된 입력은 맞고, 정렬 안 된 입력은 쌍이 있어도 놓친다", () => {
  assert.equal(hasPair([1, 3, 4, 6, 8, 10, 13], 13), true);
  assert.equal(hasPair([1, 3, 4, 6, 8, 10, 13], 15), false);
  assert.equal(hasPair([3, 9, 10, 1], 13), false); // 3 + 10 = 13 이 있는데도
  assert.equal(hasPair([...[3, 9, 10, 1]].sort((a, b) => a - b), 13), true);
});

test("pairChecks — ① 카드는 합을 3번만 보고 찾는다. 모든 쌍은 21가지", () => {
  assert.equal(pairChecks(PAIR_CARDS, PAIR_TARGET), 3);
  assert.equal(pairCount(PAIR_CARDS.length), 21);
});

test("pairChecks — 아무리 나빠도 합을 N-1 번보다 많이 보지 않는다", () => {
  for (const target of [0, 5, 15, 100]) {
    assert.ok(pairChecks(PAIR_CARDS, target) <= PAIR_CARDS.length - 1);
  }
});

test("⑥ left <= right 로 쓰면 같은 카드를 두 번 써서 없는 쌍을 찾아낸다", () => {
  const loose = (arr: number[], target: number) => {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
      const total = arr[left] + arr[right];
      if (total === target) return true;
      if (total < target) left++;
      else right--;
    }
    return false;
  };
  assert.equal(loose([1, 6, 9], 12), true); // 6 + 6 — 카드는 한 장뿐인데
  assert.equal(hasPair([1, 6, 9], 12), false);
});

test("judge — 합이 목표보다 크면 big, 작으면 small, 같으면 hit", () => {
  assert.equal(judge(PAIR_CARDS, 0, 6, 13), "big"); // 1 + 13
  assert.equal(judge(PAIR_CARDS, 0, 5, 13), "small"); // 1 + 10
  assert.equal(judge(PAIR_CARDS, 1, 5, 13), "hit"); // 3 + 10
});

test("explain — 합이 클 때 오른쪽을 버리면 맞고 왼쪽을 버리면 틀린다", () => {
  assert.equal(explain(PAIR_CARDS, 0, 6, 13, "right").ok, true);
  const bad = explain(PAIR_CARDS, 0, 6, 13, "left");
  assert.equal(bad.ok, false);
  assert.ok(bad.text.length > 0);
});

test("explain — 합이 작을 때는 반대다", () => {
  assert.equal(explain(PAIR_CARDS, 0, 5, 13, "left").ok, true);
  assert.equal(explain(PAIR_CARDS, 0, 5, 13, "right").ok, false);
});

test("① 에서 허용하는 동작만 따라가면 정확히 코드와 같은 순서로 풀린다", () => {
  let l = 0;
  let r = PAIR_CARDS.length - 1;
  let checks = 0;
  for (;;) {
    checks++;
    const j = judge(PAIR_CARDS, l, r, PAIR_TARGET);
    if (j === "hit") break;
    if (j === "big") r--;
    else l++;
  }
  assert.equal(checks, pairChecks(PAIR_CARDS, PAIR_TARGET));
  assert.deepEqual([PAIR_CARDS[l], PAIR_CARDS[r]], [3, 10]);
});
