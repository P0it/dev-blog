import test from "node:test";
import assert from "node:assert/strict";
import {
  GCD_CODE,
  HAND,
  PREDICT_OPTIONS,
  euclidCount,
  gcd,
  gcdTape,
  handRows,
  layout,
  lcm,
  pauseSpec,
} from "./gcd.ts";
import fixture from "./fixtures/gcd.json" with { type: "json" };

// fixture 는 scripts/algo/trace_gcd.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, a, b] — **그 줄을 실행한 뒤**의 상태다.

test("GCD_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(GCD_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·a·b 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = gcdTape(c.a, c.b);
    const mine = t.steps.map((s) => [s.line, s.vars.a, s.vars.b]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("gcd — 48·18 은 6, 서로소는 1, 한쪽이 0 이면 다른 쪽이다", () => {
  assert.equal(gcd(48, 18), 6);
  assert.equal(gcd(18, 48), 6);
  assert.equal(gcd(17, 5), 1);
  assert.equal(gcd(84, 36), 12);
  assert.equal(gcd(36, 72), 36);
  assert.equal(gcd(12, 0), 12);
  assert.equal(gcd(0, 0), 0);
});

test("lcm — a * b // gcd 이고 0 이 있으면 0", () => {
  assert.equal(lcm(84, 36), 252);
  assert.equal(lcm(4, 6), 12);
  assert.equal(lcm(0, 5), 0);
});

test("euclidCount — 10억 근처 최악 쌍도 43번이면 끝난다", () => {
  assert.equal(euclidCount(48, 18), 3);
  assert.equal(euclidCount(1134903170, 701408733), 43);
});

test("gcdTape(48, 18) — 8스텝이고 마지막에 6 을 돌려준다", () => {
  const t = gcdTape(48, 18);
  assert.equal(t.steps.length, 8);
  assert.equal(t.truncated, false);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.a, 6);
  assert.equal(last.vars.b, 0);
});

test("모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const [a, b] of [[48, 18], [17, 5], [18, 48], [0, 0], [12, 0]]) {
    for (const s of gcdTape(a, b).steps) assert.ok(s.line >= 1 && s.line <= GCD_CODE.length);
  }
});

test("layout(48, 18) — 정사각형 18·18 / 12 / 6·6 로 빈틈없이 채운다", () => {
  const L = layout(48, 18);
  assert.equal(L.w, 48);
  assert.equal(L.h, 18);
  assert.deepEqual(L.rounds.map((r) => r.squares.length), [2, 1, 2]);
  assert.deepEqual(L.rounds.map((r) => r.squares[0].s), [18, 12, 6]);
  const area = L.rounds.flatMap((r) => r.squares).reduce((sum, q) => sum + q.s * q.s, 0);
  assert.equal(area, 48 * 18);
  assert.equal(L.rounds.at(-1)!.region, null);
  assert.deepEqual(L.rounds[0].region, { x: 36, y: 0, w: 12, h: 18 });
  assert.deepEqual(L.rounds[1].region, { x: 36, y: 12, w: 12, h: 6 });
});

test("layout — 정사각형끼리 겹치지 않고 바닥 안에 있다", () => {
  for (const [a, b] of [[48, 18], [17, 5], [84, 36], [35, 14]]) {
    const L = layout(a, b);
    const sq = L.rounds.flatMap((r) => r.squares);
    for (const q of sq) {
      assert.ok(q.x >= 0 && q.y >= 0 && q.x + q.s <= L.w && q.y + q.s <= L.h, `${a}·${b} 바닥 밖`);
    }
    for (let i = 0; i < sq.length; i++) {
      for (let j = i + 1; j < sq.length; j++) {
        const A = sq[i];
        const B = sq[j];
        const apart = A.x + A.s <= B.x || B.x + B.s <= A.x || A.y + A.s <= B.y || B.y + B.s <= A.y;
        assert.ok(apart, `${a}·${b} 정사각형이 겹친다`);
      }
    }
    assert.equal(sq.reduce((s, q) => s + q.s * q.s, 0), a * b, `${a}·${b} 빈틈`);
  }
});

test("layout(17, 5) — 서로소라 한 변 1 짜리까지 내려간다", () => {
  const L = layout(17, 5);
  assert.deepEqual(L.rounds.map((r) => [r.squares.length, r.squares[0].s]), [[3, 5], [2, 2], [2, 1]]);
});

test("layout(18, 48) — 작은 수가 앞이면 첫 반복은 정사각형 없이 자리만 바뀐다", () => {
  const L = layout(18, 48);
  assert.equal(L.w, 48);
  assert.equal(L.h, 18);
  assert.equal(L.rounds[0].squares.length, 0);
  assert.deepEqual(L.rounds.slice(1).map((r) => r.squares.length), [2, 1, 2]);
});

test("layout — 한 변이 0 이면 깔 바닥이 없다", () => {
  const L = layout(12, 0);
  assert.equal(L.h, 0);
  assert.deepEqual(L.rounds.flatMap((r) => r.squares), []);
});

test("스텝의 tiles — 끝에서는 정사각형 5개이고 남은 바닥이 없다", () => {
  const t = gcdTape(48, 18);
  const last = t.steps.at(-1)!.stage.tiles!;
  assert.equal(last.squares.length, 5);
  assert.equal(last.region, null);
  assert.equal(t.steps[0].stage.tiles!.squares.length, 0);
});

test("스텝의 tiles — 3번 줄을 실행하면 그 반복의 정사각형이 now 로 켜진다", () => {
  const t = gcdTape(48, 18);
  const firstSwap = t.steps.find((s) => s.line === 3)!;
  const tiles = firstSwap.stage.tiles!;
  assert.equal(tiles.squares.filter((q) => q.k === tiles.now).length, 2);
  assert.equal(tiles.now, 1);
});

test("handRows — 48×18 바닥은 세 줄이고 줄마다 정답 하나, 정답 위치가 돈다", () => {
  const rows = handRows();
  assert.deepEqual([HAND.a, HAND.b], [48, 18]);
  assert.deepEqual(rows.map((r) => [r.s, r.n]), [[18, 2], [12, 1], [6, 2]]);
  for (const r of rows) {
    assert.equal(r.options.length, 3);
    assert.equal(r.options.filter((o) => o.correct).length, 1);
    for (const o of r.options.filter((x) => !x.correct)) assert.ok(o.reason.length > 0);
  }
  assert.deepEqual(rows.map((r) => r.options.findIndex((o) => o.correct)), [0, 2, 1]);
});

test("PREDICT_OPTIONS — 정답 6 은 하나뿐이고 세 번째다", () => {
  assert.equal(PREDICT_OPTIONS.filter((o) => o.correct).length, 1);
  assert.equal(PREDICT_OPTIONS[2].correct, true);
  assert.equal(PREDICT_OPTIONS[2].value, gcd(HAND.a, HAND.b));
});

test("pauseSpec — 두 번째 3번 줄 앞에서 묻고 정답은 (b, a % b)", () => {
  const t = gcdTape(48, 18);
  const p = pauseSpec(t)!;
  assert.equal(t.steps[p.at].line, 3);
  assert.deepEqual([p.a, p.b], [18, 12]);
  assert.deepEqual(p.right, [12, 6]);
  assert.equal(p.wrongs.length, 2);
  for (const w of p.wrongs) assert.notDeepEqual(w, p.right);
  assert.equal(pauseSpec(gcdTape(0, 0)), null);
});
