import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeSortTape,
  MERGE_SORT_CODE,
  MERGE_SHOWN,
  MERGE_CARDS,
  MERGE_LEFT,
  MERGE_RIGHT,
  countMergeOps,
  mergeSortLabels,
  mergeSortWithoutRest,
  mergeLevels,
  nextSide,
} from "./merge-sort.ts";
import { countOps as bubbleOps } from "./bubble-sort.ts";
import fixture from "./fixtures/merge-sort.json" with { type: "json" };

// fixture 는 scripts/algo/trace_merge_sort.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, 함수, a, b, c] — 호출(프레임)별로 **그 줄을 실행한 뒤**의 상태다.
//   merge_sort: [줄, "merge_sort", len(arr), mid, null]
//   merge:      [줄, "merge", i, j, result]

test("MERGE_SORT_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(MERGE_SORT_CODE, fixture.code);
});

test("MERGE_SHOWN — 스텝으로 올리는 줄이 fixture 와 같다", () => {
  assert.deepEqual(MERGE_SHOWN, fixture.shown);
});

test("Python 과 JS 가 같은 줄·함수·변수·result 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = mergeSortTape(c.arr);
    const mine = t.steps.map((s) =>
      s.line >= 9
        ? [s.line, "merge", s.vars.i ?? null, s.vars.j ?? null, s.stage.merge!.result]
        : [s.line, "merge_sort", s.vars.n ?? null, s.vars.mid ?? null, null],
    );
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("mergeSortTape — 끝나면 위 줄 전체가 settled 이고 값이 작은 순서다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  const last = t.steps.at(-1)!;
  assert.deepEqual(last.stage.values, [1, 2, 4, 5, 7, 9]);
  assert.ok(last.stage.cells.every((c) => c === "settled"));
  assert.deepEqual(last.stage.merge!.result, [1, 2, 4, 5, 7, 9]);
  assert.equal(last.done, true);
});

test("mergeSortTape — done 은 마지막 스텝에만 있다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  assert.equal(t.steps.filter((s) => s.done).length, 1);
  assert.equal(t.steps.at(-1)!.done, true);
});

test("mergeSortTape — 손으로 해 본 카드는 40스텝이고 상한 안에 끝난다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  assert.equal(t.steps.length, 40);
  assert.equal(t.truncated, false);
});

test("mergeSortTape — 모든 스텝의 line 이 코드 범위 안이고 올리는 줄에서만 나온다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  for (const s of t.steps) {
    assert.ok(s.line >= 1 && s.line <= MERGE_SORT_CODE.length, `line ${s.line} 범위 밖`);
    assert.ok(MERGE_SHOWN.includes(s.line), `line ${s.line} 은 올리지 않는 줄이다`);
  }
});

test("mergeSortTape — 길이 0·1 은 쪼갤 것도 합칠 것도 없어 스텝이 없다", () => {
  assert.equal(mergeSortTape([]).steps.length, 0);
  assert.equal(mergeSortTape([7]).steps.length, 0);
});

test("mergeSortTape — 합치는 구간 밖 칸은 out 이고 구간 안은 모드에 따라 칠해진다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  // 첫 스텝은 전체를 반으로 나누는 줄(4번) — 구간이 [0, 6) 전체라 전부 waiting
  assert.equal(t.steps[0].line, 4);
  assert.ok(t.steps[0].stage.cells.every((c) => c === "waiting"));
  // 둘째 스텝은 [0, 3) 을 나눈다 — 오른쪽 세 칸은 구간 밖
  assert.deepEqual(t.steps[1].stage.cells, ["waiting", "waiting", "waiting", "out", "out", "out"]);
});

test("mergeSortTape — 견주는 줄(13번)에서는 두 묶음의 맨 앞 카드 둘이 compare 다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  for (const s of t.steps.filter((x) => x.line === 13)) {
    const compare = s.stage.cells.filter((c) => c === "compare").length;
    assert.equal(compare, 2, "견주는 카드는 둘이어야 한다");
    assert.ok("i" in s.stage.flags && "j" in s.stage.flags);
  }
});

test("mergeSortTape — 내려놓은 줄(14·17번)은 방금 내려놓은 카드 하나가 current 이고 result 가 하나 는다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  t.steps.forEach((s, k) => {
    if (s.line !== 14 && s.line !== 17) return;
    assert.equal(s.stage.cells.filter((c) => c === "current").length, 1);
    const before = t.steps[k - 1].stage.merge!.result.length;
    assert.equal(s.stage.merge!.result.length, before + 1);
  });
});

test("mergeSortTape — 합치기가 끝나면(20번) 합친 줄이 위 줄의 그 자리에 되돌려 쓰인다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  const firstDone = t.steps.find((s) => s.line === 20)!;
  // 맨 처음 합치는 두 묶음 [2] 와 [9] 는 1~2번 칸이다
  assert.deepEqual(firstDone.stage.values!.slice(1, 3), [2, 9]);
  assert.deepEqual(firstDone.stage.cells, ["out", "settled", "settled", "out", "out", "out"]);
});

test("mergeSortTape — 마지막 합치기는 ① 해 보기의 두 묶음 [2,5,9] 와 [1,4,7] 이다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  const lastReady = t.steps.filter((s) => s.line === 7).at(-1)!;
  assert.equal(lastReady.note, "정렬된 두 묶음을 합칩니다. 왼쪽 [2, 5, 9], 오른쪽 [1, 4, 7]");
  assert.deepEqual(lastReady.stage.values, [2, 5, 9, 1, 4, 7]); // 두 묶음이 이미 정렬돼 위 줄에 되돌려 쓰여 있다
  assert.deepEqual([...MERGE_LEFT, ...MERGE_RIGHT].sort((a, b) => a - b), [1, 2, 4, 5, 7, 9]);
});

test("mergeSortTape — 시작 스텝에는 확정된 칸이 없다", () => {
  const t = mergeSortTape(MERGE_CARDS);
  assert.ok(!t.steps[0].stage.cells.includes("settled"));
});

test("mergeSortTape — 홀수 길이와 같은 값도 끝까지 가서 정렬된다", () => {
  assert.deepEqual(mergeSortTape([3, 1, 2, 5, 4]).steps.at(-1)!.stage.values, [1, 2, 3, 4, 5]);
  assert.deepEqual(mergeSortTape([2, 1, 2]).steps.at(-1)!.stage.values, [1, 2, 2]);
});

test("nextSide — 맨 앞 두 장 중 작은 쪽, 같으면 왼쪽, 한쪽이 비면 남은 쪽", () => {
  assert.equal(nextSide(MERGE_LEFT, MERGE_RIGHT, 0, 0), "right"); // 2 대 1
  assert.equal(nextSide([3], [3], 0, 0), "left"); // 같으면 왼쪽(코드의 <=)
  assert.equal(nextSide([5], [2, 9], 1, 0), "right"); // 왼쪽이 빔
  assert.equal(nextSide([5], [2, 9], 0, 2), "left"); // 오른쪽이 빔
  assert.equal(nextSide([5], [2], 1, 1), null);
});

test("① 해 보기 — nextSide 만 따라 누르면 두 묶음이 6번 만에 작은 순서로 합쳐진다", () => {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  for (;;) {
    const side = nextSide(MERGE_LEFT, MERGE_RIGHT, i, j);
    if (side === null) break;
    out.push(side === "left" ? MERGE_LEFT[i++] : MERGE_RIGHT[j++]);
  }
  assert.deepEqual(out, [1, 2, 4, 5, 7, 9]);
});

test("countMergeOps — 여섯 장은 합치기 5번에 16번 내려놓고 10번 견주며 3층이다", () => {
  // 합치기 5번 — 2 + 3 + 2 + 3 + 6 = 16장을 내려놓는다
  const ops = countMergeOps(MERGE_CARDS);
  assert.equal(ops.placed, 16);
  assert.equal(ops.compares, 10);
  assert.equal(ops.levels, 3);
});

test("countMergeOps — 이미 정렬된 8장도 3층을 8장씩 다시 내려놓아 24번이다", () => {
  const sorted = countMergeOps([1, 2, 3, 4, 5, 6, 7, 8]);
  const shuffled = countMergeOps([6, 3, 8, 1, 7, 2, 5, 4]);
  assert.equal(sorted.placed, 24);
  assert.equal(shuffled.placed, 24);
  assert.equal(sorted.levels, 3);
});

test("countMergeOps — 1000장은 약 1만 번, 버블 정렬은 약 50만 번", () => {
  const arr = Array.from({ length: 1000 }, (_, k) => 1000 - k);
  const ops = countMergeOps(arr);
  assert.equal(ops.levels, 10);
  assert.ok(ops.placed >= 9000 && ops.placed <= 10000, `placed ${ops.placed}`);
  assert.equal(bubbleOps(arr).compares, 499500);
});

test("mergeSortLabels — <= 는 같은 값의 순서를 지키고 < 는 뒤집는다", () => {
  const pairs: [number, string][] = [
    [2, "a"],
    [1, "c"],
    [2, "b"],
  ];
  assert.deepEqual(mergeSortLabels(pairs, "<="), ["1c", "2a", "2b"]);
  assert.deepEqual(mergeSortLabels(pairs, "<"), ["1c", "2b", "2a"]);
});

test("mergeSortWithoutRest — 남은 묶음을 이어 붙이지 않으면 카드가 사라진다", () => {
  // 실제 Python 으로도 [5, 2, 9, 1, 7, 4] → [1] 이 나온다
  assert.deepEqual(mergeSortWithoutRest(MERGE_CARDS), [1]);
});

test("mergeLevels — 여덟 장은 4층(8 → 4 → 2 → 1)이고 각 묶음에 정렬한 모양이 붙는다", () => {
  const levels = mergeLevels([6, 3, 8, 1, 7, 2, 5, 4]);
  assert.equal(levels.length, 4);
  assert.deepEqual(levels.map((l) => l.length), [1, 2, 4, 8]);
  assert.deepEqual(levels[1][0].sorted, [1, 3, 6, 8]);
  assert.deepEqual(levels[0][0].sorted, [1, 2, 3, 4, 5, 6, 7, 8]);
});
