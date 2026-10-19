import test from "node:test";
import assert from "node:assert/strict";
import {
  meetTape,
  MEET_CODE,
  MEETINGS,
  NAMES,
  overlaps,
  greedyPick,
  maxMeetings,
  bestCount,
  pickCheck,
  runVariant,
  stageFromPicks,
  type Meeting,
  type Variant,
} from "./activity-selection.ts";
import fixture from "./fixtures/activity-selection.json" with { type: "json" };

// fixture 는 scripts/algo/trace_activity_selection.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3], after[4]];
  });
}

test("MEET_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(MEET_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·s·e·count·end 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = meetTape(c.meetings as Meeting[]);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.s ?? null,
      s.vars.e ?? null,
      s.vars.count ?? null,
      s.vars.end ?? null,
    ]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("테이프의 마지막 count 가 Python 이 돌려준 값과 같다", () => {
  for (const c of fixture.cases) {
    const last = meetTape(c.meetings as Meeting[]).steps.at(-1)!;
    assert.equal(last.vars.count, c.result, `케이스: ${c.name}`);
    assert.equal(maxMeetings(c.meetings as Meeting[]), c.result, `케이스: ${c.name} — maxMeetings`);
  }
});

test("① 의 여섯 회의 — 시작 순 1개 · 짧은 순 2개 · 끝나는 시간 순 3개, 최선도 3개", () => {
  assert.equal(greedyPick(MEETINGS, "start").length, 1);
  assert.equal(greedyPick(MEETINGS, "short").length, 2);
  assert.equal(greedyPick(MEETINGS, "end").length, 3);
  assert.equal(bestCount(MEETINGS), 3);
  assert.deepEqual(
    greedyPick(MEETINGS, "end").map((i) => NAMES[i]),
    ["B", "C", "F"],
  );
  assert.deepEqual(
    greedyPick(MEETINGS, "short").map((i) => NAMES[i]),
    ["B", "E"],
  );
  assert.deepEqual(
    greedyPick(MEETINGS, "start").map((i) => NAMES[i]),
    ["A"],
  );
});

test("① 의 여섯 회의 — 플레이어는 24스텝 안팎이고 상한에 안 걸린다", () => {
  const t = meetTape(MEETINGS);
  assert.ok(t.steps.length >= 20 && t.steps.length <= 40, `스텝 ${t.steps.length}`);
  assert.equal(t.truncated, false);
});

test("테이프 — 끝나는 시간 순으로 줄을 세운 뒤 B C F 가 settled, 나머지는 dropped", () => {
  const t = meetTape(MEETINGS);
  const last = t.steps.at(-1)!;
  const rows = last.stage.timeline!.rows;
  assert.deepEqual(
    rows.map((r) => r.name),
    ["B", "C", "A", "E", "D", "F"],
  );
  assert.deepEqual(last.stage.cells, ["settled", "settled", "dropped", "dropped", "dropped", "settled"]);
  assert.equal(last.done, true);
});

test("테이프 — 첫 스텝(2번 줄)에서 이미 끝나는 시간 순이고, 아직 아무것도 고르지 않았다", () => {
  const first = meetTape(MEETINGS).steps[0];
  assert.equal(first.line, 2);
  assert.ok(first.stage.cells.every((c) => c === "out"));
  assert.equal(first.stage.timeline!.end, undefined);
});

test("테이프 — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const c of fixture.cases) {
    for (const s of meetTape(c.meetings as Meeting[]).steps) {
      assert.ok(s.line >= 1 && s.line <= MEET_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("테이프 — 빈 목록과 회의 하나에서도 테이프가 생긴다", () => {
  assert.ok(meetTape([]).steps.length >= 1);
  assert.equal(meetTape([]).steps.at(-1)!.vars.count, 0);
  assert.equal(meetTape([[9, 10]]).steps.at(-1)!.vars.count, 1);
});

test("overlaps — 끝과 시작이 맞닿으면 겹치지 않는다", () => {
  assert.equal(overlaps([10, 11], [11, 15]), false);
  assert.equal(overlaps([9, 16], [15, 20]), true);
  assert.equal(overlaps([10, 12], [11, 13]), true);
});

test("pickCheck — 겹치는 회의는 못 고르고 어느 회의와 겹치는지 알려 준다", () => {
  // A(0) 를 고른 뒤 F(5, 15~20)는 A(9~16)와 겹친다
  const r = pickCheck(MEETINGS, [0], 5);
  assert.deepEqual(r, { ok: false, with: 0 });
  // B(1) 를 고른 뒤 C(2, 11~15)는 맞닿을 뿐이라 고를 수 있다
  assert.deepEqual(pickCheck(MEETINGS, [1], 2), { ok: true, action: "add" });
  // 이미 고른 회의를 다시 누르면 되돌린다
  assert.deepEqual(pickCheck(MEETINGS, [1], 1), { ok: true, action: "remove" });
});

test("끝나는 시간 순은 어떤 입력에서도 최선이다(무작위 400개를 모든 경우와 비교)", () => {
  // 시드가 있는 간단한 난수 — 테스트가 매번 같게 돈다
  let seed = 12345;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };
  for (let k = 0; k < 400; k++) {
    const n = 1 + rnd(7);
    const ms: Meeting[] = [];
    for (let i = 0; i < n; i++) {
      const s = rnd(10);
      ms.push([s, s + 1 + rnd(6)]);
    }
    assert.equal(maxMeetings(ms), bestCount(ms), `입력 ${JSON.stringify(ms)}`);
    assert.equal(greedyPick(ms, "end").length, bestCount(ms));
  }
});

test("greedyPick — 고른 회의끼리는 서로 겹치지 않는다", () => {
  for (const kind of ["start", "short", "end"] as const) {
    const picked = greedyPick(MEETINGS, kind);
    for (let i = 0; i < picked.length; i++) {
      for (let j = i + 1; j < picked.length; j++) {
        assert.equal(overlaps(MEETINGS[picked[i]], MEETINGS[picked[j]]), false, `${kind}: ${picked}`);
      }
    }
  }
});

test("runVariant — 코드를 바꿔 돌린 값이 실제 Python 과 같다", () => {
  for (const v of fixture.variants) {
    const variant: Variant = { key: v.key as Variant["key"], strict: v.strict };
    assert.equal(runVariant(v.meetings as Meeting[], variant), v.result, `변형: ${v.name}`);
  }
});

test("⑥ 의 함정 — 시작 순으로 정렬하면 1개, 정렬을 안 하면 1개, `>` 이면 맞닿은 회의를 놓친다", () => {
  assert.equal(runVariant(MEETINGS, { key: "end" }), 3);
  assert.equal(runVariant(MEETINGS, { key: "start" }), 1);
  assert.equal(runVariant(MEETINGS, { key: "none" }), 1);
  assert.equal(runVariant([[1, 2], [2, 3]], { key: "end", strict: true }), 1);
  assert.equal(runVariant([[1, 2], [2, 3]], { key: "end" }), 2);
  assert.equal(runVariant([[3, 3], [1, 3]], { key: "end_only" }), 1);
  assert.equal(runVariant([[3, 3], [1, 3]], { key: "end" }), 2);
});

test("⑤ 확인 문제 — C 를 지우면 같은 코드가 B 다음 E 를 잡아 2개다", () => {
  const rest = MEETINGS.filter((_, i) => NAMES[i] !== "C");
  assert.equal(maxMeetings(rest), 2);
});

test("stageFromPicks — 고른 회의는 settled, 아직 안 고른 회의는 out", () => {
  const s = stageFromPicks(MEETINGS, [1, 2]);
  assert.deepEqual(s.cells, ["out", "settled", "settled", "out", "out", "out"]);
  assert.equal(s.timeline!.end, 15);
  assert.equal(stageFromPicks(MEETINGS, []).timeline!.end, undefined);
});
