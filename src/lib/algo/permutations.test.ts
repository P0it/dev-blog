import test from "node:test";
import assert from "node:assert/strict";
import {
  permuteTape,
  PERM_CODE,
  PERM_ITEMS,
  PERM_KEPT_LINES,
  permutationsOf,
  combinationsOf,
  factorial,
  countPerm,
  countComb,
  firstUndoGate,
  letterJosa,
} from "./permutations.ts";
import fixture from "./fixtures/permutations.json" with { type: "json" };

// fixture 는 scripts/algo/trace_permutations.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 한 행은 [line, i, path, used, len(result)] 이고, line 이벤트는 줄을 실행하기 **전**에 찍힌다.
// 스텝의 그림은 그 줄을 실행한 **뒤**의 모습이라 다음 행의 상태를 쓴다(마지막 행은 제 상태).
// i 는 그 줄이 있는 호출의 반복 변수라 제 행의 것을 쓴다.
type Row = [number, number | null, string, string, number];

const KEPT = new Set(PERM_KEPT_LINES);

function pythonSteps(trace: Row[]) {
  const out: (string | number | null)[][] = [];
  trace.forEach((row, k) => {
    // 맨 처음 행(2번 줄, 아무도 안 선 모습)과 4·10·12 번 줄만 플레이어가 올린다
    if (k !== 0 && !KEPT.has(row[0])) return;
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    out.push([row[0], row[1], after[2], after[3], after[4]]);
  });
  return out;
}

function mine(items: string[]) {
  return permuteTape(items).steps.map((s) => {
    const p = s.stage.perm!;
    return [
      s.line,
      s.vars.i ?? null,
      p.path.map((k) => p.items[k]).join(""),
      p.used.map((u) => (u ? "1" : "0")).join(""),
      s.vars["len(result)"],
    ];
  });
}

test("PERM_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PERM_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·자리·사용·결과 개수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    assert.deepEqual(mine(c.items), pythonSteps(c.trace as Row[]), `케이스: ${c.name}`);
  }
});

test("친구 셋 — 스텝이 37개이고 4·10·12 번 줄이 6·15·15 번이다", () => {
  const t = permuteTape(PERM_ITEMS);
  assert.equal(t.steps.length, 37);
  const count = (line: number) => t.steps.filter((s) => s.line === line).length;
  assert.equal(count(4), 6);
  assert.equal(count(10), 15);
  assert.equal(count(12), 15);
  assert.equal(count(2), 1);
});

test("마지막 스텝 — 6 가지를 다 모았고 done 이다", () => {
  const last = permuteTape(PERM_ITEMS).steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.stage.perm!.result.length, 6);
  assert.equal(last.stage.perm!.mode, "done");
  assert.deepEqual(last.stage.perm!.path, []);
});

test("찾는 차례 — 사전 순으로 ABC ACB BAC BCA CAB CBA", () => {
  const last = permuteTape(PERM_ITEMS).steps.at(-1)!;
  assert.deepEqual(last.stage.perm!.result, ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
  assert.deepEqual(permutationsOf(PERM_ITEMS), ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
});

test("같은 순서를 두 번 담지 않는다 — 서로 다른 친구면 중복이 없다", () => {
  const r = permutationsOf(PERM_ITEMS);
  assert.equal(new Set(r).size, r.length);
});

test("같은 값이 섞이면 같은 순서가 중복으로 나온다 (6 가지 중 서로 다른 건 3 가지)", () => {
  const r = permutationsOf(["A", "A", "B"]);
  assert.equal(r.length, 6);
  assert.equal(new Set(r).size, 3);
  assert.equal(fixture.facts.dup.length, 6);
  assert.equal(fixture.facts.dupUnique, 3);
});

test("자리 수 — 어느 스텝에서도 path 길이가 0~n 안이고 used 와 어긋나지 않는다", () => {
  for (const s of permuteTape(PERM_ITEMS).steps) {
    const p = s.stage.perm!;
    assert.ok(p.path.length <= 3);
    assert.equal(p.used.filter(Boolean).length, p.path.length, `step line ${s.line}`);
    assert.equal(new Set(p.path).size, p.path.length, "한 친구가 두 자리에 설 수 없다");
  }
});

test("모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const s of permuteTape(PERM_ITEMS).steps) {
    assert.ok(s.line >= 1 && s.line <= PERM_CODE.length, `line ${s.line} 범위 밖`);
  }
});

test("친구가 없으면 빈 줄 한 가지로 끝난다", () => {
  const t = permuteTape([]);
  assert.equal(t.steps.length, 2);
  assert.equal(t.steps.at(-1)!.done, true);
  assert.deepEqual(t.steps.at(-1)!.stage.perm!.result, [""]);
});

test("친구가 한 명이면 한 가지다", () => {
  const last = permuteTape(["A"]).steps.at(-1)!;
  assert.deepEqual(last.stage.perm!.result, ["A"]);
  assert.equal(last.done, true);
});

test("firstUndoGate — 처음 되돌리는 스텝이고 바로 앞이 첫 결과를 담은 스텝이다", () => {
  const t = permuteTape(PERM_ITEMS);
  const g = firstUndoGate(t);
  assert.equal(t.steps[g].line, 12);
  assert.equal(t.steps[g - 1].line, 4);
  assert.deepEqual(t.steps[g - 1].stage.perm!.result, ["ABC"]);
  // 되돌리고 나면 C 가 빠져 A B 만 선다
  assert.deepEqual(t.steps[g].stage.perm!.path, [0, 1]);
});

test("경우의 수 — 3! 은 6, 4! 은 24, 10! 과 12! 은 페이지에 적은 숫자다", () => {
  assert.equal(factorial(3), 6);
  assert.equal(factorial(4), 24);
  assert.equal(factorial(10), 3_628_800);
  assert.equal(factorial(12), 479_001_600);
  assert.equal(factorial(0), 1);
});

test("뽑는 수 — 3 명에서 2 자리 순열은 6, 조합은 3 이고 fixture 와 같다", () => {
  assert.equal(countPerm(3, 2), 6);
  assert.equal(countComb(3, 2), 3);
  assert.equal(countPerm(4, 4), 24);
  assert.equal(fixture.facts.itertoolsPerm2.length, 6);
  assert.deepEqual(
    combinationsOf(PERM_ITEMS, 2),
    fixture.facts.itertoolsComb2.map((x: string[]) => x.join("")),
  );
});

test("⑥ 틀리는 자리 — path 를 복사하지 않으면 전부 빈 줄이고, 되돌리지 않으면 한 가지뿐이다", () => {
  assert.deepEqual(fixture.facts.noCopy, [[], [], [], [], [], []]);
  assert.deepEqual(fixture.facts.noUnchoose, [["A", "B", "C"]]);
});

test("직접 잰 값 — 10! 은 360만 가지, 8 명은 4만 320 가지", () => {
  assert.equal(fixture.facts.perm10, 3_628_800);
  assert.equal(fixture.facts.own8Count, 40_320);
  assert.equal(fixture.facts.itertoolsPerm.length, 6);
});

test("letterJosa — L M N R 만 받침이 있다", () => {
  assert.equal(letterJosa("A", "을", "를"), "A를");
  assert.equal(letterJosa("B", "을", "를"), "B를");
  assert.equal(letterJosa("C", "을", "를"), "C를");
  assert.equal(letterJosa("L", "을", "를"), "L을");
  assert.equal(letterJosa("M", "은", "는"), "M은");
});
