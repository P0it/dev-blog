import test from "node:test";
import assert from "node:assert/strict";
import {
  bracketTape,
  isBalanced,
  BRACKET_CODE,
  BRACKET_OK,
  BRACKET_BAD,
  EDIT_ACTIONS,
  undoTop,
  canUndoAt,
  remainingAfter,
  nextAction,
} from "./stack.ts";
import fixture from "./fixtures/stack.json" with { type: "json" };

// fixture 는 scripts/algo/trace_stack.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (string | number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("BRACKET_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(BRACKET_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·스택 시퀀스를 낸다 (글자는 5~10줄에서만 대조)", () => {
  for (const c of fixture.cases) {
    const t = bracketTape(c.s);
    const py = pythonSteps(c.trace);
    assert.equal(t.steps.length, py.length, `케이스: ${c.name} — 스텝 수`);
    t.steps.forEach((s, k) => {
      // 2번 줄은 아직 stack 이 만들어지기 전이라 None, 3번 줄부터 문자열이다
      const stack = s.line < 3 ? null : (s.stage.stack ?? []).join("");
      assert.equal(s.line, py[k][0], `케이스: ${c.name} — ${k}번째 줄`);
      assert.equal(stack, py[k][2], `케이스: ${c.name} — ${k}번째 스택`);
      if (s.line >= 5 && s.line <= 10) {
        const at = s.stage.flags.i;
        assert.equal((s.stage.chars ?? [])[at], py[k][1], `케이스: ${c.name} — ${k}번째 글자`);
      }
    });
  }
});

test("마지막 스텝의 done 이 Python 의 반환값과 같다", () => {
  for (const c of fixture.cases) {
    const last = bracketTape(c.s).steps.at(-1)!;
    assert.equal(last.done, c.result, `케이스: ${c.name}`);
    assert.equal(isBalanced(c.s), c.result, `케이스: ${c.name} — isBalanced`);
  }
});

test("① 과 ④ 가 같은 입력이다 — 맞는 문자열은 True, 같은 길이의 틀린 문자열은 False", () => {
  assert.equal(BRACKET_OK.length, BRACKET_BAD.length);
  assert.equal(isBalanced(BRACKET_OK), true);
  assert.equal(isBalanced(BRACKET_BAD), false);
});

test("스텝 수 — 두 입력 모두 25 안팎(30 이하)에 끝나고 상한에 닿지 않는다", () => {
  for (const s of [BRACKET_OK, BRACKET_BAD]) {
    const t = bracketTape(s);
    assert.ok(t.steps.length <= 30, `${s}: ${t.steps.length}스텝`);
    assert.equal(t.truncated, false);
  }
});

test("bracketTape — 여는 괄호는 쌓이고 닫는 괄호는 맨 위가 걷힌다", () => {
  const t = bracketTape(BRACKET_OK);
  const depth = t.steps.map((s) => (s.stage.stack ?? []).length);
  assert.equal(Math.max(...depth), 3);
  assert.equal(depth.at(-1), 0);
  // 3개가 쌓인 직후 첫 닫는 괄호 `}` 의 맨 위는 `{` 다
  const peak = t.steps.find((s) => (s.stage.stack ?? []).length === 3)!;
  assert.deepEqual(peak.stage.stack, ["(", "[", "{"]);
});

test("bracketTape — 어긋난 닫는 괄호에서 멈추고 스택은 그대로다", () => {
  const t = bracketTape(BRACKET_BAD);
  const last = t.steps.at(-1)!;
  assert.equal(last.line, 9);
  assert.equal(last.done, false);
  assert.deepEqual(last.stage.stack, ["(", "[", "{"]);
  assert.equal(last.stage.cells[3], "dropped");
});

test("bracketTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const s of ["", ")", "(()", "a(b)c", BRACKET_OK, BRACKET_BAD]) {
    for (const st of bracketTape(s).steps) assert.ok(st.line >= 1 && st.line <= BRACKET_CODE.length);
  }
});

test("bracketTape — 빈 문자열에서도 테이프가 생기고 True 로 끝난다", () => {
  const last = bracketTape("").steps.at(-1)!;
  assert.equal(last.done, true);
});

test("⑥ 끝났는데 스택이 남으면 짝이 안 맞는다 — `(()` 는 False", () => {
  assert.equal(isBalanced("(()"), false);
  assert.equal(isBalanced(")("), false);
  assert.equal(isBalanced("(]"), false);
});

// ── ① 해 보기: 되돌리기는 맨 위부터만 ──

test("EDIT_ACTIONS — 세 가지 작업이 고정 순서다", () => {
  assert.deepEqual([...EDIT_ACTIONS], ["글자 굵게", "그림 넣기", "색 바꾸기"]);
});

test("nextAction — 한 일이 쌓인 수만큼 다음 작업이 나온다", () => {
  assert.equal(nextAction([]), "글자 굵게");
  assert.equal(nextAction(["글자 굵게"]), "그림 넣기");
  assert.equal(nextAction([...EDIT_ACTIONS]), null);
});

test("undoTop — 가장 마지막에 한 것부터 나온다", () => {
  const first = undoTop([...EDIT_ACTIONS]);
  assert.equal(first.undone, "색 바꾸기");
  const second = undoTop(first.pile);
  assert.equal(second.undone, "그림 넣기");
  assert.deepEqual(second.pile, ["글자 굵게"]);
});

test("undoTop — 비어 있으면 아무것도 안 나오고 그대로다", () => {
  const r = undoTop([]);
  assert.equal(r.undone, null);
  assert.deepEqual(r.pile, []);
});

test("canUndoAt — 맨 위만 되돌릴 수 있다. 가운데는 안 된다", () => {
  const pile = [...EDIT_ACTIONS];
  assert.equal(canUndoAt(pile, 2), true);
  assert.equal(canUndoAt(pile, 1), false);
  assert.equal(canUndoAt(pile, 0), false);
});

test("remainingAfter — 세 가지를 하고 두 번 되돌리면 가장 먼저 한 것이 남는다", () => {
  assert.deepEqual(remainingAfter(3, 2), ["글자 굵게"]);
  assert.deepEqual(remainingAfter(3, 0), [...EDIT_ACTIONS]);
});
