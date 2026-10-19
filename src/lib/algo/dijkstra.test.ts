import test from "node:test";
import assert from "node:assert/strict";
import {
  dijkstraTape,
  DIJK_CODE,
  GRAPH,
  NAMES,
  START,
  TARGET,
  EDGES,
  shortestTimes,
  initialState,
  closestCandidate,
  pickCheck,
  confirmNode,
  fewestHops,
  fastestPath,
  setWeight,
  runVariant,
  handOrder,
} from "./dijkstra.ts";
import fixture from "./fixtures/dijkstra.json" with { type: "json" };

// fixture 는 scripts/algo/trace_dijkstra.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다. 테이프는 while·for 머리줄(5·9번)과 `if d > dist[u]`
// (7번)를 스텝으로 올리지 않는다 — 그 줄을 다 올리면 70스텝이 넘어 연타로 끝난다. 올리는 줄만 대조한다.
type Row = [number, number | null, string | null, string | null, number | null, (number | null)[] | null, [number, string][]];
const EMIT = new Set([4, 6, 8, 10, 11, 12, 13]);
function pythonSteps(trace: Row[]) {
  return trace
    .map((row, k) => {
      const after = k + 1 < trace.length ? trace[k + 1] : row;
      return { line: row[0], d: after[1], u: after[2], v: after[3], w: after[4], dist: after[5], heap: after[6] };
    })
    .filter((r) => EMIT.has(r.line));
}

test("DIJK_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(DIJK_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·d·u·v·w·거리표·큐 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = dijkstraTape(c.graph as unknown as Record<string, [string, number][]>, c.start);
    const names = Object.keys(c.graph);
    const py = pythonSteps(c.trace as Row[]);
    assert.equal(t.steps.length, py.length, `케이스: ${c.name} — 스텝 수`);
    t.steps.forEach((s, k) => {
      const g = s.stage.graph!;
      const at = `케이스: ${c.name} — ${k}번째(${s.line}번 줄)`;
      assert.equal(s.line, py[k].line, `${at} 줄`);
      assert.deepEqual(g.dist, py[k].dist, `${at} 거리표`);
      assert.deepEqual(
        g.queue.map(([d, i]) => [d, names[i]]),
        py[k].heap,
        `${at} 큐`,
      );
      if ([6, 8, 10, 11, 12].includes(s.line)) {
        assert.equal(s.vars.d ?? null, py[k].d, `${at} d`);
        assert.equal(g.now === undefined ? null : names[g.now], py[k].u, `${at} u`);
      }
      if ([10, 11, 12].includes(s.line)) {
        assert.equal(s.vars.w ?? null, py[k].w, `${at} w`);
        assert.equal(g.look === undefined ? null : names[g.look], py[k].v, `${at} v`);
      }
    });
  }
});

test("마지막 스텝의 거리표가 Python 의 반환값과 같다", () => {
  for (const c of fixture.cases) {
    const g = c.graph as unknown as Record<string, [string, number][]>;
    const names = Object.keys(g);
    const last = dijkstraTape(g, c.start).steps.at(-1)!;
    assert.deepEqual(
      names.map((n, i) => [n, last.stage.graph!.dist[i]]),
      names.map((n) => [n, (c.result as Record<string, number | null>)[n]]),
      `케이스: ${c.name}`,
    );
    assert.equal(last.done, true);
  }
});

test("① 과 ④ 가 같은 지도다 — 여섯 곳과 일곱 개의 길", () => {
  assert.deepEqual(NAMES, ["S", "A", "B", "C", "D", "E"]);
  assert.equal(START, "S");
  assert.equal(TARGET, "E");
  assert.equal(EDGES.length, 7);
  assert.deepEqual(shortestTimes(GRAPH, START), { S: 0, A: 2, B: 3, C: 7, D: 5, E: 6 });
});

test("dijkstraTape — 기본 지도는 36스텝이고 상한에 닿지 않는다", () => {
  const t = dijkstraTape();
  assert.equal(t.steps.length, 36);
  assert.equal(t.truncated, false);
  assert.ok(t.steps.length >= 25 && t.steps.length <= 40);
});

test("dijkstraTape — 낡은 항목(5, B)은 8번 줄(continue)에서 건너뛴다", () => {
  const t = dijkstraTape();
  const skip = t.steps.filter((s) => s.line === 8);
  assert.equal(skip.length, 1);
  assert.equal(skip[0].vars.d, 5);
  assert.ok(skip[0].note.includes("낡은"));
});

test("dijkstraTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const s of dijkstraTape().steps) assert.ok(s.line >= 1 && s.line <= DIJK_CODE.length);
});

test("dijkstraTape — 빈 입력(시작점만)에서도 테이프가 생긴다", () => {
  const t = dijkstraTape({ S: [] }, "S");
  assert.ok(t.steps.length >= 3);
  assert.equal(t.steps.at(-1)!.done, true);
});

// ── ① 해 보기: 가장 가까운 곳부터 확정 ──
test("initialState — S 만 0분이고 아직 아무 곳도 확정하지 않았다", () => {
  const s = initialState();
  assert.deepEqual(s.dist, [0, null, null, null, null, null]);
  assert.deepEqual(s.confirmed, [false, false, false, false, false, false]);
  assert.deepEqual(closestCandidate(s), { idx: 0, d: 0 });
});

test("pickCheck — 가는 길을 모르는 곳은 막고, 가장 가까운 곳은 통과한다", () => {
  const s = initialState();
  assert.deepEqual(pickCheck(s, 2), { ok: false, reason: "unknown" });
  assert.deepEqual(pickCheck(s, 0), { ok: true });
});

test("확정 순서 S → A → B → D → E 로 5곳이면 E 까지 6분이다", () => {
  let s = initialState();
  const order = ["S", "A", "B", "D", "E"].map((n) => NAMES.indexOf(n));

  // S 확정: A 2, B 5 로 적힌다
  let r = confirmNode(s, order[0]);
  assert.deepEqual(r.changes, [
    { to: 1, from: null, time: 2 },
    { to: 2, from: null, time: 5 },
  ]);
  s = r.state;
  // B(5) 를 먼저 누르면 더 가까운 A(2) 가 남아 있다
  assert.deepEqual(pickCheck(s, 2), { ok: false, reason: "farther", closest: { idx: 1, d: 2 } });

  // A 확정: B 는 5 → 3 으로 줄고 C 는 7 로 처음 적힌다
  r = confirmNode(s, order[1]);
  assert.deepEqual(r.changes, [
    { to: 2, from: 5, time: 3 },
    { to: 3, from: null, time: 7 },
  ]);
  s = r.state;

  // B 확정: D 5
  r = confirmNode(s, order[2]);
  assert.deepEqual(r.changes, [{ to: 4, from: null, time: 5 }]);
  s = r.state;

  // D 확정: E 6 — 이제 E(6) 와 C(7) 중 E 가 가장 가깝다
  r = confirmNode(s, order[3]);
  assert.deepEqual(r.changes, [{ to: 5, from: null, time: 6 }]);
  s = r.state;
  assert.deepEqual(closestCandidate(s), { idx: 5, d: 6 });
  assert.deepEqual(pickCheck(s, 3), { ok: false, reason: "farther", closest: { idx: 5, d: 6 } });

  r = confirmNode(s, order[4]);
  assert.equal(r.state.dist[5], 6);
  assert.equal(r.state.confirmed.filter(Boolean).length, 5);
  // 확정한 곳은 또 누를 수 없다
  assert.deepEqual(pickCheck(r.state, 0), { ok: false, reason: "done" });
});

// ── ② 되짚기: 걸음 수와 시간 ──
test("걸음이 가장 적은 길은 3구간이고 8분 또는 10분, 가장 빠른 길은 4구간 6분이다", () => {
  const h = fewestHops(GRAPH, START, TARGET);
  assert.equal(h.hops, 3);
  assert.deepEqual(h.paths.map((p) => [p.names.join(""), p.time]), [
    ["SBDE", 8],
    ["SACE", 10],
  ]);
  const f = fastestPath(GRAPH, START, TARGET);
  assert.deepEqual(f, { names: ["S", "A", "B", "D", "E"], time: 6, hops: 4 });
});

// ── ⑤ 확인 문제와 ⑥ 틀리는 자리(실제 Python 으로 확인한 값) ──
test("setWeight — A–B 길을 4분으로 바꾸면 E 까지 8분(S→B→D→E)이고 예전 길은 9분이다", () => {
  const g = setWeight(GRAPH, "A", "B", 4);
  assert.equal(shortestTimes(g, START).E, 8);
  assert.equal(fastestPath(g, START, TARGET).time, 8);
  // 예전 길(S→A→B→D→E)을 새 시간으로 다시 계산하면 2 + 4 + 2 + 1 = 9
  const old = fewestHops(g, START, TARGET).paths;
  assert.ok(old.length >= 1);
});

test("runVariant — 낡은 항목 건너뛰기: 있을 때 확인 14번, 없으면 17번, 거리는 같다", () => {
  const a = runVariant(GRAPH, START, {});
  const b = runVariant(GRAPH, START, { staleCheck: false });
  assert.deepEqual({ pops: a.pops, checks: a.checks, updates: a.updates, stales: a.stales }, { pops: 7, checks: 14, updates: 6, stales: 1 });
  assert.equal(b.checks, 17);
  assert.deepEqual(a.dist, b.dist);
});

test("runVariant — 큐에 (곳, 거리) 순서로 넣으면 답은 같지만 더 많이 꺼내고 고친다", () => {
  const a = runVariant(GRAPH, START, {});
  const n = runVariant(GRAPH, START, { nodeFirst: true });
  assert.deepEqual(n.dist, a.dist);
  assert.equal(n.pops, 8);
  assert.equal(n.updates, 7);
  assert.equal(n.stales, 2);
});

test("runVariant — 거리를 0 으로 시작하면 아무것도 고쳐지지 않아 모두 0 이다", () => {
  const z = runVariant(GRAPH, START, { initZero: true });
  assert.deepEqual(Object.values(z.dist), [0, 0, 0, 0, 0, 0]);
  assert.equal(z.updates, 0);
});

test("runVariant — 음수 길이: 값을 고쳐 다시 넣어 답은 맞고, 음수 순환이면 끝나지 않는다", () => {
  const neg = runVariant({ S: [["A", 1], ["B", 2]], A: [["C", 1]], B: [["A", -3]], C: [] }, "S", {});
  assert.deepEqual(neg.dist, { S: 0, A: -1, B: 2, C: 0 });
  const cyc = runVariant({ S: [["A", 1]], A: [["B", -2]], B: [["A", 1]] }, "S", { limit: 2000 });
  assert.equal(cyc.hitLimit, true);
  assert.equal(cyc.pops, 2000);
});

test("handOrder — 가장 가까운 곳부터 눌러 E 까지 5곳을 확정한다", () => {
  assert.deepEqual(handOrder(), [
    { name: "S", time: 0 },
    { name: "A", time: 2 },
    { name: "B", time: 3 },
    { name: "D", time: 5 },
    { name: "E", time: 6 },
  ]);
});
