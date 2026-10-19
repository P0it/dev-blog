import test from "node:test";
import assert from "node:assert/strict";
import {
  KNAP_CODE,
  ITEMS,
  CAPACITY,
  knapTable,
  cellInfo,
  bestValue,
  traceBack,
  knapNoCheck,
  knap1dForward,
  knap1dBackward,
  greedyByRatio,
  GREEDY_COUNTER,
  knapsackTape,
  knapGate,
  choiceCells,
  predictOptions,
  subsetCount,
  tableCells,
} from "./knapsack.ts";
import fixture from "./fixtures/knapsack.json" with { type: "json" };

// fixture 는 scripts/algo/trace_knapsack.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, i, w, wt, dp] — **그 줄을 실행한 뒤**의 상태다. 화면 스텝은 줄 3·5·7·9·10 만 올린다(2·4·6·8 은 뺀다).

test("KNAP_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(KNAP_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·w·wt·표 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const items = c.items as [number, number][];
    const t = knapsackTape(items.map(([w, v], k) => ({ name: "ABCDE"[k], w, v })), c.W);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.vars.w ?? null, s.vars.wt ?? null, s.stage.knap!.dp]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("knapTable — ① 의 입력은 용량 5 에서 최대 가치 7 이고 표가 손으로 푼 것과 같다", () => {
  assert.deepEqual(knapTable(), [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 3, 3, 3, 3],
    [0, 0, 3, 4, 4, 7],
    [0, 0, 3, 4, 5, 7],
  ]);
  assert.equal(bestValue(ITEMS, CAPACITY), 7);
});

test("traceBack — 표를 거꾸로 따라가면 A 와 B 를 담았다", () => {
  assert.deepEqual(traceBack(ITEMS, CAPACITY), [0, 1]);
});

test("bestValue — 용량을 6 으로 바꾸면 8(A+C)이다", () => {
  assert.equal(bestValue(ITEMS, 6), 8);
});

test("cellInfo — (2,5) 는 안 담기 3, 담기 7 이고 담는 쪽이 이긴다", () => {
  const t = knapTable();
  const c = cellInfo(t, 2, 5);
  assert.equal(c.skip, 3);
  assert.equal(c.take, 7);
  assert.equal(c.left, 3);
  assert.equal(c.answer, 7);
  assert.equal(c.takeWins, true);
});

test("cellInfo — 무게가 용량보다 크면 담기 후보가 없다", () => {
  const t = knapTable();
  const c = cellInfo(t, 1, 1);
  assert.equal(c.take, null);
  assert.equal(c.answer, 0);
  assert.equal(c.takeWins, false);
});

test("choiceCells — 채울 칸 15개 중 고를 칸이 9개, 담을 수 없는 칸이 6개다", () => {
  const cells = choiceCells();
  assert.equal(cells.length, 15);
  assert.equal(cells.filter((c) => c.take !== null).length, 9);
  assert.equal(cells.filter((c) => c.take === null).length, 6);
  // 두 후보가 같은 칸은 없다 — 더 큰 쪽이 하나로 정해진다
  for (const c of cells.filter((x) => x.take !== null)) assert.notEqual(c.skip, c.take);
});

test("knapsackTape — 29스텝이고 마지막이 done 이며 표가 완성돼 있다", () => {
  const t = knapsackTape();
  assert.equal(t.steps.length, 29);
  assert.equal(t.truncated, false);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.line, 10);
  assert.deepEqual(last.stage.knap!.dp, knapTable());
});

test("knapsackTape — 모든 스텝의 line 이 코드 범위 안이고 2·4·6·8 번 줄은 올리지 않는다", () => {
  const t = knapsackTape();
  for (const s of t.steps) {
    assert.ok(s.line >= 1 && s.line <= KNAP_CODE.length);
    assert.ok(![2, 4, 6, 8].includes(s.line));
  }
});

test("knapsackTape — 담을 수 없는 칸은 7번 줄만 있고 담을 수 있는 칸은 7·9번 줄이 이어진다", () => {
  const t = knapsackTape();
  const at = (i: number, w: number) =>
    t.steps.filter((s) => s.vars.i === i && s.vars.w === w && (s.line === 7 || s.line === 9)).map((s) => s.line);
  assert.deepEqual(at(1, 1), [7]);
  assert.deepEqual(at(1, 2), [7, 9]);
  assert.deepEqual(at(3, 3), [7]);
  assert.deepEqual(at(3, 5), [7, 9]);
});

test("knapGate — 예측 관문은 (2,5) 칸의 9번 줄 앞이고 바로 앞 스텝은 같은 칸의 7번 줄이다", () => {
  const t = knapsackTape();
  const g = knapGate(t);
  assert.equal(t.steps[g].line, 9);
  assert.equal(t.steps[g].vars.i, 2);
  assert.equal(t.steps[g].vars.w, 5);
  assert.equal(t.steps[g - 1].line, 7);
  assert.equal(t.steps[g - 1].vars.w, 5);
  // 7번 줄을 실행한 뒤에는 안 담기 값 3 이 들어 있고 아직 담기 후보로 바뀌기 전이다
  assert.equal(t.steps[g - 1].stage.knap!.dp[2][5], 3);
});

test("줄 7 의 설명은 담기 결과를 미리 말하지 않는다", () => {
  for (const s of knapsackTape().steps.filter((x) => x.line === 7)) {
    assert.ok(!s.note.includes("담으면"), s.note);
  }
});

test("predictOptions — 정답 7 이 첫 번째이고 12(전부 담기)와 5(C 하나)가 오답이다", () => {
  const o = predictOptions();
  assert.equal(o.length, 3);
  assert.equal(o.filter((x) => x.correct).length, 1);
  assert.equal(o[0].value, 7);
  assert.equal(o[0].correct, true);
  assert.deepEqual(
    o.map((x) => x.value).sort((a, b) => a - b),
    [5, 7, 12],
  );
});

test("⑥ 1차원 표를 앞으로 도르면 A 를 두 번 담아 용량 4 가 6 이 되고 거꾸로 돌면 5 다", () => {
  assert.deepEqual(knap1dBackward(ITEMS, CAPACITY), [0, 0, 3, 4, 5, 7]);
  assert.deepEqual(knap1dForward(ITEMS, CAPACITY), [0, 0, 3, 4, 6, 7]);
});

test("⑥ 범위 검사를 빼면 표의 끝 칸이 읽혀 12 가 나온다", () => {
  assert.equal(knapNoCheck(ITEMS, CAPACITY), 12);
});

test("⑥ 가치가 무게당 큰 것부터 담는 그리디는 반례에서 5 이고 표는 6 이다", () => {
  assert.equal(greedyByRatio(GREEDY_COUNTER.items, GREEDY_COUNTER.W), 5);
  assert.equal(bestValue(GREEDY_COUNTER.items, GREEDY_COUNTER.W), 6);
  assert.equal(greedyByRatio(ITEMS, CAPACITY), 7);
});

test("Python 으로 돌려 확인한 ⑥ 값이 JS 와 같다", () => {
  const f = fixture.facts;
  assert.equal(f.nocheck, knapNoCheck(ITEMS, CAPACITY));
  assert.deepEqual(f.forward, knap1dForward(ITEMS, CAPACITY));
  assert.deepEqual(f.backward, knap1dBackward(ITEMS, CAPACITY));
  assert.equal(f.greedy_counter.greedy, greedyByRatio(GREEDY_COUNTER.items, GREEDY_COUNTER.W));
  assert.equal(f.greedy_counter.best, bestValue(GREEDY_COUNTER.items, GREEDY_COUNTER.W));
  assert.equal(f.w6, bestValue(ITEMS, 6));
});

test("② 의 숫자 — 물건 30개면 2^30 가지, 표는 30×1000 칸이다", () => {
  assert.equal(subsetCount(30), 1_073_741_824);
  assert.equal(tableCells(30, 1000), 30_000);
});
