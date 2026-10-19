import test from "node:test";
import assert from "node:assert/strict";
import {
  lineTape,
  LINE_CODE,
  LINE_START,
  LINE_EVENTS,
  serveLine,
  serveOrder,
  shiftCount,
  HAND_EVENTS,
  TEACHER,
  wanted,
  stepHand,
  whoLabel,
} from "./queue-deque.ts";
import fixture from "./fixtures/queue-deque.json" with { type: "json" };

// fixture 는 scripts/algo/trace_queue_deque.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("LINE_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(LINE_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = lineTape(c.line, c.events);
    const mine = t.steps.map((s) => [s.line, s.vars.e ?? null, s.vars["len(q)"] ?? null, s.vars["len(served)"] ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("serveLine — 받은 순서가 Python 이 돌려준 값과 같다", () => {
  for (const c of fixture.cases) {
    assert.deepEqual(serveLine(c.line, c.events), c.served, `케이스: ${c.name}`);
  }
});

test("lineTape — ① 과 같은 8명은 22스텝이고 끝은 받은 순서 1 2 3 4 다", () => {
  const t = lineTape(LINE_START, LINE_EVENTS);
  assert.equal(t.steps.length, 22);
  assert.equal(t.truncated, false);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.deepEqual(last.stage.line!.served, [1, 2, 3, 4]);
  assert.deepEqual(last.stage.queue, [5, 6, 7, 8, 9, 10]);
});

test("lineTape — 모든 스텝의 line 이 코드 범위 안이고 함수 안 줄만 켠다", () => {
  for (const c of fixture.cases) {
    for (const s of lineTape(c.line, c.events).steps) {
      assert.ok(s.line >= 3 && s.line <= LINE_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("lineTape — 도착은 맨 뒤에 서고 받기는 맨 앞에서 나간다", () => {
  const t = lineTape([1, 2, 3], [4, 0]);
  const arrive = t.steps.find((s) => s.line === 9)!;
  assert.deepEqual(arrive.stage.queue, [1, 2, 3, 4]);
  assert.equal(arrive.stage.line!.hot, "back");
  const serve = t.steps.find((s) => s.line === 7)!;
  assert.deepEqual(serve.stage.queue, [2, 3, 4]);
  assert.deepEqual(serve.stage.line!.served, [1]);
  assert.equal(serve.stage.line!.hot, "front");
});

test("lineTape — 빈 줄·일 없음에서도 테이프가 생긴다", () => {
  assert.ok(lineTape([], []).steps.length >= 1);
  assert.ok(lineTape([1], []).steps.length >= 1);
});

test("shiftCount — 리스트 pop(0) 이었다면 받을 때마다 남은 사람을 한 칸씩 당긴다", () => {
  // ① 과 같은 일: 받을 때 줄에 남는 사람 수 7, 7, 6, 6
  assert.equal(shiftCount(LINE_START, LINE_EVENTS), 7 + 7 + 6 + 6);
  assert.equal(lineTape(LINE_START, LINE_EVENTS).steps.at(-1)!.stage.line!.shifted, 26);
  // 10만 명을 다 받으면 99,999 + … + 0 = n(n-1)/2
  const n = 1000;
  const big = Array.from({ length: n }, (_, i) => i + 1);
  assert.equal(shiftCount(big, Array(n).fill(0)), (n * (n - 1)) / 2);
});

test("serveOrder — ⑤ 오답 둘은 스택처럼 쓸 때 실제로 나오는 순서다", () => {
  assert.deepEqual(serveOrder(LINE_START, LINE_EVENTS, "queue"), [1, 2, 3, 4]);
  // 뒤에서 넣고 뒤에서 받으면
  assert.deepEqual(serveOrder(LINE_START, LINE_EVENTS, "backBack"), [8, 9, 7, 10]);
  // 앞에 서고 앞에서 받으면
  assert.deepEqual(serveOrder(LINE_START, LINE_EVENTS, "frontFront"), [1, 9, 2, 10]);
});

// ── ① 직접 해 보기 ──

test("wanted — 이벤트마다 해야 할 동작이 하나로 정해진다", () => {
  assert.equal(wanted({ kind: "arrive", who: 9 }), "pushBack");
  assert.equal(wanted({ kind: "serve" }), "popFront");
  assert.equal(wanted({ kind: "teacher" }), "pushFront");
  assert.equal(wanted({ kind: "leave" }), "popBack");
});

test("stepHand — 맞는 동작만 따라가면 받은 순서 1 2 3 4 선생님, 남은 줄 5~9", () => {
  let line = [...LINE_START];
  const served: number[] = [];
  for (const ev of HAND_EVENTS) {
    const r = stepHand(line, ev, wanted(ev), true);
    assert.equal(r.ok, true, JSON.stringify(ev));
    line = r.line;
    if (r.out !== undefined && ev.kind === "serve") served.push(r.out);
  }
  assert.deepEqual(served, [1, 2, 3, 4, TEACHER]);
  assert.deepEqual(line, [5, 6, 7, 8, 9]);
});

test("stepHand — 두 버튼뿐인 줄에서는 선생님·맨 뒤 나가기를 어떤 버튼으로도 못 한다", () => {
  const line = [5, 6, 7];
  for (const ev of [{ kind: "teacher" } as const, { kind: "leave" } as const]) {
    for (const act of ["pushBack", "popFront"] as const) {
      const r = stepHand(line, ev, act, false);
      assert.equal(r.ok, false);
      assert.deepEqual(r.line, line, "틀리면 줄은 그대로다");
      assert.ok(r.text.includes("규칙"), "규칙을 풀라는 안내가 나온다");
    }
  }
});

test("stepHand — 틀린 동작은 줄을 바꾸지 않고 이유를 말한다", () => {
  const line = [2, 3, 4];
  const r = stepHand(line, { kind: "arrive", who: 9 }, "popFront", false);
  assert.equal(r.ok, false);
  assert.deepEqual(r.line, line);
  assert.ok(r.text.length > 0);
});

test("① 선생님이 끼지 않으면 5번 손님은 5번째로 받는다", () => {
  // 선생님 없이 받기만 5번 하면 5번째가 5번 손님
  assert.deepEqual(serveOrder(LINE_START, [0, 9, 0, 0, 10, 0, 0], "queue").at(-1), 5);
  assert.equal(serveOrder(LINE_START, [0, 9, 0, 0, 10, 0, 0], "queue").length, 5);
});

test("whoLabel — 선생님만 이름이고 나머지는 번호다", () => {
  assert.equal(whoLabel(TEACHER), "선생님");
  assert.equal(whoLabel(5), "5번");
});
