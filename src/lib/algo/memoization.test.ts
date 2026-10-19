import test from "node:test";
import assert from "node:assert/strict";
import {
  MEMO_CODE,
  memoTape,
  memoGate,
  fullTree,
  memoEvents,
  replay,
  fibValue,
  plainCalls,
  memoCalls,
  memoComputes,
} from "./memoization.ts";
import fixture from "./fixtures/memoization.json" with { type: "json" };

// fixture 는 scripts/algo/trace_memoization.py 가 실제 Python 을 settrace 로 돌려 만든다.
// line 이벤트는 줄을 실행하기 전에 찍힌다. 화면 스텝은 줄 2·3·5·7·8 만 올린다.

test("MEMO_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(MEMO_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·n·수첩 크기·호출 탑 높이 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = memoTape(c.n);
    const mine = t.steps.map((s) => [s.line, s.vars.n, s.vars["len(memo)"], s.stage.frames!.length]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("fib(6) — 스텝이 27개이고 호출 탑은 가장 높을 때 6층이다", () => {
  const t = memoTape(6);
  assert.equal(t.steps.length, 27);
  assert.equal(Math.max(...t.steps.map((s) => s.stage.frames!.length)), 6);
});

test("마지막 스텝 — fib(6) = 8 을 돌려주고 done 이며 수첩에는 값이 7개다", () => {
  const last = memoTape(6).steps.at(-1)!;
  assert.equal(last.line, 8);
  assert.equal(last.done, true);
  assert.deepEqual(last.stage.frames, [{ n: 6, ret: 8 }]);
  assert.equal(last.stage.memo!.notebook.length, 7);
  assert.equal(fibValue(6), 8);
});

test("memoGate — 첫 번째로 수첩에서 꺼내 쓰는 호출(줄 3)이다. 바로 앞 스텝은 같은 n 의 줄 2 다", () => {
  const t = memoTape(6);
  const g = memoGate(t);
  assert.equal(t.steps[g].line, 3);
  assert.equal(t.steps[g].stage.memo!.hit, true);
  assert.equal(t.steps[g - 1].line, 2);
  assert.equal(t.steps[g - 1].vars.n, t.steps[g].vars.n);
  // 이 호출은 fib(1) 이고, 그때 수첩에는 이미 1 이 적혀 있다
  assert.equal(t.steps[g].vars.n, 1);
  assert.ok(t.steps[g].stage.memo!.notebook.some((e) => e.n === 1));
});

test("줄 2 의 설명은 결과를 미리 말하지 않는다 — 예측 관문이 그 뒤에 있다", () => {
  for (const s of memoTape(6).steps.filter((x) => x.line === 2)) {
    assert.ok(!s.note.includes("있습니다") && !s.note.includes("없습니다"), s.note);
  }
});

test("수첩은 줄 5·8 을 실행한 다음 스텝부터 한 칸씩 늘어난다 — n 값이 겹치지 않는다", () => {
  const t = memoTape(6);
  for (const s of t.steps) {
    const ns = s.stage.memo!.notebook.map((e) => e.n);
    assert.equal(new Set(ns).size, ns.length);
    assert.equal(s.stage.memo!.notebook.length, s.vars["len(memo)"]);
  }
});

test("n = 0, 1 — 호출이 한 번이고 바로 수첩에 적고 끝난다", () => {
  for (const n of [0, 1]) {
    const t = memoTape(n);
    assert.deepEqual(
      t.steps.map((s) => s.line),
      [2, 5],
    );
    assert.equal(t.steps.at(-1)!.done, true);
  }
});

test("n 이 0 보다 작거나 정수가 아니면 거절한다", () => {
  assert.throws(() => memoTape(-1), RangeError);
  assert.throws(() => memoTape(1.5), RangeError);
});

test("모든 스텝의 line 이 코드 범위 안에 있다", () => {
  for (const s of memoTape(6).steps) assert.ok(s.line >= 1 && s.line <= MEMO_CODE.length);
});

// ── ① 해 보기 — 호출 나무와 수첩 ──

test("fullTree(6) — 호출이 25번이고 id 는 부른 순서(앞에서부터)다", () => {
  const nodes = fullTree(6);
  assert.equal(nodes.length, 25);
  assert.equal(nodes.length, fixture.facts.plainCalls6);
  assert.deepEqual(
    nodes.map((x) => x.id),
    nodes.map((_, i) => i),
  );
  assert.equal(nodes[0].n, 6);
  assert.equal(nodes[0].parent, null);
  // 위쪽 부모가 자식보다 먼저, 왼쪽 자식이 오른쪽 자식보다 먼저
  for (const x of nodes.filter((y) => y.parent !== null)) assert.ok(x.parent! < x.id);
});

test("fullTree — 자식은 n−1 과 n−2 이고 부분 나무 크기가 맞다", () => {
  const nodes = fullTree(6);
  for (const x of nodes) {
    if (x.n < 2) assert.equal(x.kids.length, 0);
    else assert.deepEqual(x.kids.map((k) => nodes[k].n), [x.n - 1, x.n - 2]);
  }
  assert.equal(nodes[0].size, 25);
});

test("memoEvents(6) — 호출 11번 = 계산 7번 + 꺼내 쓰기 4번, 수첩에 적는 일이 7번", () => {
  const ev = memoEvents(6);
  const calls = ev.filter((e) => e.type === "call");
  assert.equal(calls.length, 11);
  assert.equal(calls.filter((e) => e.type === "call" && e.kind === "compute").length, 7);
  assert.equal(calls.filter((e) => e.type === "call" && e.kind === "hit").length, 4);
  assert.equal(ev.filter((e) => e.type === "write").length, 7);
  assert.equal(calls.length, fixture.facts.memoCalls6);
  assert.equal(memoComputes(6), fixture.facts.memoComputes6);
});

test("memoEvents — 호출 순서가 Python 스텝의 줄 2 순서와 같다", () => {
  const nodes = fullTree(6);
  const ev = memoEvents(6).filter((e) => e.type === "call");
  const py = memoTape(6)
    .steps.filter((s) => s.line === 2)
    .map((s) => s.vars.n);
  assert.deepEqual(
    ev.map((e) => (e.type === "call" ? nodes[e.id].n : -1)),
    py,
  );
});

test("replay(6, 0) — 아무것도 안 눌렀을 때 다음은 맨 위 호출이고 계산해야 한다", () => {
  const r = replay(6, 0);
  assert.deepEqual(r.next, { id: 0, kind: "compute" });
  assert.equal(r.notebook.length, 0);
  assert.equal(r.finished, false);
});

test("replay — 모든 호출을 누르면 끝나고 수첩에 0~6 이 한 번씩 적힌다", () => {
  const r = replay(6, 11);
  assert.equal(r.finished, true);
  assert.equal(r.next, null);
  assert.equal(r.computes, 7);
  assert.equal(r.hits, 4);
  assert.deepEqual(
    [...r.notebook].sort((a, b) => a.n - b.n),
    [0, 1, 2, 3, 4, 5, 6].map((n) => ({ n, v: fibValue(n) })),
  );
  // 건너뛴 호출 = 25 − 11
  assert.equal(r.states.filter((s) => s === "skipped").length, 14);
});

test("replay — 눌러 가는 동안 수첩 크기는 줄어들지 않고 next 의 n 이 수첩에 있으면 꺼내 쓰기다", () => {
  const nodes = fullTree(6);
  let prev = 0;
  for (let k = 0; k <= 11; k++) {
    const r = replay(6, k);
    assert.ok(r.notebook.length >= prev);
    prev = r.notebook.length;
    if (r.next) {
      const has = r.notebook.some((e) => e.n === nodes[r.next!.id].n);
      assert.equal(r.next.kind, has ? "hit" : "compute", `k=${k}`);
    }
  }
});

test("replay 는 범위를 넘는 k 를 끝으로 취급한다", () => {
  assert.equal(replay(6, 99).finished, true);
});

test("호출 횟수 — 수첩이 없으면 2·fib(n+1)−1, 있으면 2n−1 이고 계산은 n+1 번이다", () => {
  assert.equal(plainCalls(6), 25);
  assert.equal(plainCalls(30), fixture.facts.plainCalls30);
  for (const n of [1, 2, 6, 7, 20, 30]) {
    assert.equal(memoCalls(n), 2 * n - 1, `n=${n}`);
    assert.equal(memoComputes(n), n + 1, `n=${n}`);
  }
  assert.equal(memoCalls(30), fixture.facts.memoCalls30);
  assert.equal(memoComputes(30), fixture.facts.memoComputes30);
  // ⑤ 확인 문제 — fib(7)
  assert.equal(memoComputes(7), fixture.facts.memoComputes7);
  assert.equal(memoCalls(7), fixture.facts.memoCalls7);
});

test("⑥ 에 적은 사실 — fixture 의 값이 페이지 숫자의 근거다", () => {
  assert.equal(fixture.facts.newMemoEachCall20, plainCalls(20));
  assert.equal(fixture.facts.sharedMemoCalls20, memoCalls(20));
  assert.equal(fixture.facts.depthError5000, "RecursionError");
  assert.equal(fixture.facts.recursionLimit, 1000);
  assert.equal(fixture.facts.unhashable, "unhashable type: 'list'");
  assert.equal(fixture.facts.lruCacheFib6, 8);
  // 돌려주는 값이 바뀌는 함수를 캐시하면 처음 값만 나오고 실제로는 한 번만 돈다
  assert.deepEqual(fixture.facts.impureTicks, [1, 1, 1]);
  assert.equal(fixture.facts.impureRuns, 1);
});
