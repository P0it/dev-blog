import test from "node:test";
import assert from "node:assert/strict";
import {
  QUEENS_CODE,
  QUEEN_N,
  queensTape,
  attackedBy,
  safeCols,
  nextCol,
  attackReason,
  countPlacements,
  countSolutions,
  firstSolution,
  choose,
  handScript,
  firstScanIndex,
  firstEmptyScanIndex,
} from "./n-queens.ts";
import fixture from "./fixtures/n-queens.json" with { type: "json" };

// fixture 는 scripts/algo/trace_n_queens.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 화면 스텝은 줄 2·3·8·11·12 만 올린다. 줄 8·11 은 줄을 실행한 뒤 상태, 줄 2·3·12 는 그대로다.

test("QUEENS_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(QUEENS_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·row·col·퀸 수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = queensTape(c.n);
    const mine = t.steps.map((s) => [s.line, s.vars.row, s.vars.col ?? null, s.vars.queens]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("N=4 — 첫 해까지 26스텝이고 마지막 스텝은 done 이며 퀸이 4개다", () => {
  const t = queensTape(4);
  assert.equal(t.steps.length, 26);
  const last = t.steps.at(-1)!;
  assert.equal(last.line, 3);
  assert.equal(last.done, true);
  assert.deepEqual(last.stage.queens!.at, [1, 3, 0, 2]);
});

test("N=3 — 해가 없다. 마지막 스텝은 줄 0 에서 막혀 done 이 false 다", () => {
  const last = queensTape(3).steps.at(-1)!;
  assert.equal(last.line, 12);
  assert.equal(last.done, false);
  assert.equal(last.stage.queens!.row, 0);
});

test("N=1 — 퀸 하나를 놓으면 끝난다", () => {
  const t = queensTape(1);
  assert.deepEqual(
    t.steps.map((s) => s.line),
    [2, 8, 2, 3],
  );
});

test("모든 스텝의 line 이 코드 범위 안이고 줄 8·11 은 퀸 수가 그 줄을 실행한 뒤 값이다", () => {
  for (const n of [1, 2, 3, 4, 5]) {
    for (const s of queensTape(n).steps) {
      assert.ok(s.line >= 1 && s.line <= QUEENS_CODE.length);
      const placed = s.stage.queens!.at.filter((c) => c >= 0).length;
      // 퀸 수 변수는 보드에 놓인 퀸 수와 늘 같다(줄 8 은 놓은 뒤, 줄 11 은 거둔 뒤)
      assert.equal(s.vars.queens, placed, `line ${s.line} row ${s.vars.row}`);
    }
  }
});

test("attackedBy — 같은 열과 두 대각선을 노린다. 위 줄만 본다", () => {
  const at = [0, -1, -1, -1];
  assert.equal(attackedBy(at, 1, 0)?.kind, "column");
  assert.equal(attackedBy(at, 1, 1)?.kind, "diagonal");
  assert.equal(attackedBy(at, 2, 2)?.kind, "diagonal");
  assert.equal(attackedBy(at, 1, 2), null);
  // 같은 줄이나 아래 줄에 놓인 퀸은 보지 않는다
  assert.equal(attackedBy([-1, 0, -1, -1], 1, 0), null);
});

test("attackedBy — 반대 대각선(줄 + 열이 같은 칸)도 노린다", () => {
  const at = [3, -1, -1, -1];
  assert.equal(attackedBy(at, 1, 2)?.kind, "diagonal");
  assert.equal(attackedBy(at, 3, 0)?.kind, "diagonal");
});

test("safeCols·nextCol — 놓을 수 있는 칸을 왼쪽부터 찾는다", () => {
  assert.deepEqual(safeCols([0, -1, -1, -1], 1), [2, 3]);
  assert.deepEqual(safeCols([0, 2, -1, -1], 2), []);
  assert.equal(nextCol([0, -1, -1, -1], 1, 0), 2);
  assert.equal(nextCol([0, -1, -1, -1], 1, 3), 3);
  assert.equal(nextCol([0, -1, -1, -1], 1, 4), null);
});

test("attackReason — 열이면 같은 열, 대각선이면 대각선으로 노린다고 말한다", () => {
  assert.match(attackReason({ row: 0, col: 0, kind: "column" }), /같은 열/);
  assert.match(attackReason({ row: 0, col: 0, kind: "diagonal" }), /대각선/);
});

test("해의 개수 — Python 으로 센 값과 같다", () => {
  for (const [n, want] of Object.entries(fixture.facts.solutionsByN)) {
    assert.equal(countSolutions(Number(n)), want, `N=${n}`);
  }
  assert.equal(countSolutions(10), fixture.facts.solutions10);
});

test("첫 해 — Python 이 찾은 것과 같다", () => {
  assert.deepEqual(firstSolution(4), fixture.facts.firstSolution4);
  assert.deepEqual(firstSolution(8), fixture.facts.firstSolution8);
  assert.equal(firstSolution(3), null);
});

test("퀸을 놓은 횟수 — Python 으로 센 값과 같다", () => {
  assert.equal(countPlacements(4, true), fixture.facts.placementsFirst4);
  assert.equal(countPlacements(4, false), fixture.facts.placementsAll4);
  assert.equal(countPlacements(8, true), fixture.facts.placementsFirst8);
  assert.equal(countPlacements(8, false), fixture.facts.placementsAll8);
});

test("choose — 4×4 에서 퀸 4개를 놓는 모든 배치와 8×8 의 수", () => {
  assert.equal(choose(16, 4), fixture.facts.choose16c4);
  assert.equal(choose(64, 8), fixture.facts.choose64c8);
});

test("handScript — 놓기 8번과 거두기 4번이고 ④ 플레이어의 줄 8·11 과 같은 순서다", () => {
  const script = handScript(QUEEN_N);
  assert.equal(script.filter((a) => a.kind === "place").length, fixture.facts.placementsFirst4);
  assert.equal(script.filter((a) => a.kind === "back").length, 4);
  const tape = queensTape(QUEEN_N);
  const fromTape = tape.steps
    .filter((s) => s.line === 8 || s.line === 11)
    .map((s) => ({ kind: s.line === 8 ? "place" : "back", row: s.vars.row, col: s.vars.col }));
  assert.deepEqual(script, fromTape);
});

test("firstScanIndex·firstEmptyScanIndex — 줄 2 의 스텝을 가리키고 첫 막다른 줄은 줄 2 다", () => {
  const t = queensTape(QUEEN_N);
  const empty = firstEmptyScanIndex(t);
  assert.ok(empty > 0);
  assert.equal(t.steps[empty].line, 2);
  assert.equal(t.steps[empty].vars.row, 2);
  assert.deepEqual(t.steps[empty].stage.queens!.at, [0, 2, -1, -1]);
  assert.equal(t.steps[firstScanIndex(t, 1)].vars.row, 1);
});

test("줄 2 의 설명은 놓을 수 있는 칸을 말한다 — 예측 관문은 그 스텝 앞에서 묻는다", () => {
  const t = queensTape(QUEEN_N);
  assert.match(t.steps[firstEmptyScanIndex(t)].note, /하나도 없습니다/);
});
