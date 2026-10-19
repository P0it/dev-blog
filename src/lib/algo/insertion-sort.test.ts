import test from "node:test";
import assert from "node:assert/strict";
import {
  insertionSortTape,
  INSERTION_SORT_CODE,
  INSERT_CARDS,
  countInsertionOps,
  insertionLabels,
  insertionWithoutPlace,
  initHand,
  stepHand,
  handStage,
  type HandAction,
  type HandState,
} from "./insertion-sort.ts";
import { countOps as bubbleOps } from "./bubble-sort.ts";
import { countSelectionOps } from "./selection-sort.ts";
import fixture from "./fixtures/insertion-sort.json" with { type: "json" };

// fixture 는 scripts/algo/trace_insertion_sort.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, i, key, j, 배열] — **그 줄을 실행한 뒤**의 상태다. `j -= 1`(7번)은 스텝이 아니라 뺐다.

test("INSERTION_SORT_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(INSERTION_SORT_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·key·j·배열 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = insertionSortTape(c.arr);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.i ?? null,
      s.vars.key ?? null,
      s.vars.j ?? null,
      s.stage.values,
    ]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("insertionSortTape — 끝나면 모든 칸이 settled 이고 값이 정렬돼 있다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  const last = t.steps.at(-1)!;
  assert.ok(last.stage.cells.every((c) => c === "settled"));
  assert.deepEqual(last.stage.values, [1, 2, 4, 5, 7, 9]);
  assert.equal(last.done, true);
});

test("insertionSortTape — 손으로 해 본 카드는 43스텝이고 상한 안에 끝난다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  assert.equal(t.steps.length, 43);
  assert.equal(t.truncated, false);
});

test("insertionSortTape — 모든 스텝의 line 이 코드 범위 안이고 j -= 1(7번)은 스텝이 아니다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= INSERTION_SORT_CODE.length, `line ${s.line} 범위 밖`);
  assert.equal(t.steps.filter((s) => s.line === 7).length, 0);
});

test("insertionSortTape — 카드를 집으면(3번) 그 칸이 빈자리가 되고 손에 든 카드가 위에 선다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  const first = t.steps.find((s) => s.line === 3)!;
  assert.equal(first.stage.gap, 1);
  assert.deepEqual(first.stage.queue, [2]);
});

test("insertionSortTape — 밀 때마다(6번) 빈자리가 한 칸 왼쪽으로 옮겨 온다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  // 네 번째 카드 1 은 9·5·2 를 차례로 민다 — 빈자리가 3 → 2 → 1 → 0
  const shifts = t.steps.filter((s) => s.line === 6 && s.vars.key === 1);
  assert.deepEqual(
    shifts.map((s) => s.stage.gap),
    [2, 1, 0],
  );
});

test("insertionSortTape — 놓으면(8번) 빈자리와 손에 든 카드가 사라진다", () => {
  const t = insertionSortTape(INSERT_CARDS);
  for (const s of t.steps.filter((x) => x.line === 8)) {
    assert.equal(s.stage.gap, undefined);
    assert.equal(s.stage.queue, undefined);
  }
});

test("insertionSortTape — 빈 배열과 길이 1 은 for 머리와 return 두 스텝으로 끝난다", () => {
  for (const arr of [[], [7]]) {
    const t = insertionSortTape(arr);
    assert.deepEqual(
      t.steps.map((s) => s.line),
      [2, 9],
    );
    assert.equal(t.steps.at(-1)!.done, true);
  }
});

test("countInsertionOps — 손으로 해 본 카드는 견주기 11번, 밀기 8번이다", () => {
  assert.deepEqual(countInsertionOps(INSERT_CARDS), { compares: 11, shifts: 8 });
});

test("countInsertionOps — 밀기는 버블 정렬이 바꾸는 횟수(거꾸로 선 쌍의 수)와 같다", () => {
  for (const arr of [INSERT_CARDS, [6, 5, 4, 3, 2, 1], [1, 2, 4, 7, 5, 9], [2, 2, 1], []]) {
    assert.equal(countInsertionOps(arr).shifts, bubbleOps(arr).swaps, JSON.stringify(arr));
  }
});

test("countInsertionOps — 이미 정렬돼 있으면 견주기 n-1번, 밀기 0번이다", () => {
  assert.deepEqual(countInsertionOps([1, 2, 4, 5, 7, 9]), { compares: 5, shifts: 0 });
  assert.deepEqual(countInsertionOps([1, 2, 3, 4, 5]), { compares: 4, shifts: 0 });
});

test("countInsertionOps — 거꾸로 선 카드는 n(n-1)/2 번 견주고 밀어서 선택 정렬(항상 n(n-1)/2)과 같아진다", () => {
  const rev = [6, 5, 4, 3, 2, 1];
  assert.deepEqual(countInsertionOps(rev), { compares: 15, shifts: 15 });
  assert.equal(countSelectionOps(rev).compares, 15);
});

test("countInsertionOps — 거의 정렬된 줄은 정렬된 줄에 가깝게 적게 견준다", () => {
  assert.deepEqual(countInsertionOps([1, 2, 4, 7, 5, 9]), { compares: 6, shifts: 1 });
  assert.equal(countInsertionOps([1, 2, 4, 3, 5]).compares, 5);
  assert.equal(countInsertionOps([5, 4, 3, 2, 1]).compares, 10);
});

test("insertionLabels — 삽입 정렬은 안정 정렬이다: 2a 2b 1c → 1c 2a 2b", () => {
  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];
  assert.deepEqual(insertionLabels(pairs, ">"), ["1c", "2a", "2b"]);
});

test("insertionLabels — > 대신 >= 를 쓰면 이미 정렬된 1a 1b 2c 에서도 같은 값끼리 자리가 뒤집힌다", () => {
  const pairs: [number, string][] = [
    [1, "a"],
    [1, "b"],
    [2, "c"],
  ];
  assert.deepEqual(insertionLabels(pairs, ">"), ["1a", "1b", "2c"]);
  assert.deepEqual(insertionLabels(pairs, ">="), ["1b", "1a", "2c"]);
});

test("insertionWithoutPlace — 마지막에 key 를 놓는 줄을 빼면 카드가 사라진다", () => {
  assert.deepEqual(insertionWithoutPlace([5, 2, 9]), [5, 5, 9]);
  assert.deepEqual(insertionWithoutPlace(INSERT_CARDS), [5, 5, 5, 5, 9, 9]);
  assert.deepEqual(insertionWithoutPlace([1, 2, 3]), [1, 2, 3]);
});

// ── ① 손으로 하는 해 보기 — 허용 동작이 곧 삽입 정렬의 동작이다 ──

/** 알고리즘이 하는 대로 정답 동작만 골라 끝까지 간다. */
function playRight(cards: number[]): { state: HandState; log: HandAction[] } {
  let state = initHand(cards);
  const log: HandAction[] = [];
  let guard = 0;
  while (!state.done && guard++ < 200) {
    const k = state.key!;
    const action: HandAction =
      state.hole === 0 ? "front" : state.slots[state.hole - 1]! > k ? "bigger" : "notBigger";
    const r = stepHand(state, action);
    assert.equal(r.ok, true, `정답 동작이 막혔다: ${action}`);
    state = r.state;
    log.push(action);
  }
  return { state, log };
}

test("initHand — 두 번째 카드 2 를 집어 들고 그 칸이 빈자리다", () => {
  const s = initHand(INSERT_CARDS);
  assert.equal(s.key, 2);
  assert.equal(s.hole, 1);
  assert.equal(s.slots[1], null);
  assert.equal(s.compares, 0);
  assert.equal(s.shifts, 0);
});

test("정답 동작만 하면 정렬이 끝나고 견주기 11번·밀기 8번으로 countInsertionOps 와 같다", () => {
  const { state } = playRight(INSERT_CARDS);
  assert.equal(state.done, true);
  assert.deepEqual(state.slots, [1, 2, 4, 5, 7, 9]);
  assert.deepEqual({ compares: state.compares, shifts: state.shifts }, countInsertionOps(INSERT_CARDS));
});

test("정답 동작만 하면 어떤 입력이든 정렬되고 횟수가 countInsertionOps 와 같다", () => {
  for (const arr of [[1, 2, 4, 5, 7, 9], [9, 7, 5, 4, 2, 1], [1, 2, 4, 7, 5, 9], [2, 2, 1], [3, 1]]) {
    const { state } = playRight(arr);
    assert.deepEqual(state.slots, [...arr].sort((a, b) => a - b));
    assert.deepEqual({ compares: state.compares, shifts: state.shifts }, countInsertionOps(arr), JSON.stringify(arr));
  }
});

test("큰 카드를 두고 '크지 않다' 고 하면 막히고 상태가 그대로다", () => {
  const s = initHand(INSERT_CARDS); // 손패 5, 손에 든 카드 2 — 5 는 2 보다 크다
  const r = stepHand(s, "notBigger");
  assert.equal(r.ok, false);
  assert.deepEqual(r.state, s);
  assert.match(r.text, /5/);
});

test("크지 않은 카드를 '크다' 고 하면 막힌다 — 같은 값도 크지 않다", () => {
  let s = initHand([2, 5, 9]); // 손패 2, 손에 든 카드 5
  const r = stepHand(s, "bigger");
  assert.equal(r.ok, false);
  s = initHand([5, 5, 1]);
  const same = stepHand(s, "bigger"); // 손패 5, 손에 든 카드 5 — 같으면 안 민다
  assert.equal(same.ok, false);
  assert.equal(stepHand(s, "notBigger").ok, true);
});

test("맨 앞까지 왔을 때는 front 만 되고, 왼쪽 카드가 남아 있는데 front 를 누르면 막힌다", () => {
  const s0 = initHand([5, 2, 9]);
  assert.equal(stepHand(s0, "front").ok, false); // 아직 5 가 왼쪽에 있다
  const s1 = stepHand(s0, "bigger").state; // 5 를 민다 → 빈자리가 맨 앞
  assert.equal(s1.hole, 0);
  assert.equal(stepHand(s1, "bigger").ok, false);
  assert.equal(stepHand(s1, "notBigger").ok, false);
  assert.equal(stepHand(s1, "front").ok, true);
});

test("밀 때마다 빈자리가 한 칸 왼쪽으로 오고 밀기·견주기가 1씩 는다, 놓는 건 견주기만 센다", () => {
  const s0 = initHand(INSERT_CARDS);
  const s1 = stepHand(s0, "bigger").state;
  assert.equal(s1.hole, 0);
  assert.equal(s1.slots[1], 5);
  assert.equal(s1.shifts, 1);
  assert.equal(s1.compares, 1);
  const s2 = stepHand(s1, "front").state; // 맨 앞이라 놓기 — 견주기는 늘지 않는다
  assert.equal(s2.compares, 1);
  assert.deepEqual(s2.slots.slice(0, 2), [2, 5]);
});

test("네 번째 카드 1 은 세 칸을 밀고 맨 앞에 놓인다 — ① 의 예상 정답이다", () => {
  let s = initHand(INSERT_CARDS);
  let shiftsForOne = 0;
  while (!s.done) {
    const k = s.key!;
    const a: HandAction = s.hole === 0 ? "front" : s.slots[s.hole - 1]! > k ? "bigger" : "notBigger";
    if (k === 1 && a === "bigger") shiftsForOne++;
    s = stepHand(s, a).state;
  }
  assert.equal(shiftsForOne, 3);
});

test("handStage — 빈자리·손에 든 카드·견주는 칸이 그려진다", () => {
  const s = initHand(INSERT_CARDS);
  const st = handStage(s);
  assert.equal(st.gap, 1);
  assert.deepEqual(st.queue, [2]);
  assert.equal(st.cells[0], "compare"); // 빈자리 왼쪽 카드와 견준다
  assert.equal(st.cells[5], "out"); // 아직 안 받은 카드
});

test("handStage — 다 놓으면 전부 settled 이고 빈자리가 없다", () => {
  const { state } = playRight(INSERT_CARDS);
  const st = handStage(state);
  assert.ok(st.cells.every((c) => c === "settled"));
  assert.equal(st.gap, undefined);
  assert.equal(st.queue, undefined);
});
