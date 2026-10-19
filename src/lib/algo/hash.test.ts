import test from "node:test";
import assert from "node:assert/strict";
import {
  hashTape,
  HASH_CODE,
  HASH_NAMES,
  HASH_TARGET,
  SLOTS,
  codeSum,
  slotOf,
  placeAll,
  findName,
  calcText,
  remText,
  firstScanStep,
  tryPlace,
} from "./hash.ts";
import fixture from "./fixtures/hash.json" with { type: "json" };

// fixture 는 scripts/algo/trace_hash.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("HASH_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(HASH_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·slot·filled 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = hashTape(c.names, c.target);
    const mine = t.steps.map((s) => [s.line, s.vars.slot ?? null, s.vars.filled ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("findName — Python 이 돌려준 True/False 와 같다", () => {
  for (const c of fixture.cases) {
    assert.equal(findName(c.names, c.target), c.found, `케이스: ${c.name}`);
  }
});

test("slotOf — ① 의 여섯 이름이 정한 칸 번호", () => {
  assert.deepEqual(
    HASH_NAMES.map((n) => slotOf(n)),
    [1, 6, 7, 3, 0, 3],
  );
  assert.equal(SLOTS, 8);
});

test("codeSum — 글자 번호의 합이고 순서와 상관없다", () => {
  assert.equal(codeSum("zed"), 323);
  assert.equal(codeSum("tom"), 336);
  assert.equal(codeSum("mot"), 336);
  assert.equal(slotOf("tom"), slotOf("mot"));
});

test("placeAll — zed 는 bob 이 있는 3번 칸에 이어 붙는다", () => {
  const b = placeAll(HASH_NAMES);
  assert.equal(b.length, 8);
  assert.deepEqual(b[3], ["bob", "zed"]);
  assert.deepEqual(b[0], ["tom"]);
  assert.deepEqual(b[2], []);
});

test("hashTape — ① 과 같은 여섯 이름은 26스텝이고 끝에서 zed 를 찾는다", () => {
  const t = hashTape(HASH_NAMES, HASH_TARGET);
  assert.equal(t.steps.length, 26);
  assert.equal(t.truncated, false);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.deepEqual(last.stage.hash!.buckets[3], ["bob", "zed"]);
});

test("hashTape — 표에 없는 이름은 끝에서 done 이 false 다", () => {
  const t = hashTape(["kim", "lee", "amy"], "bob");
  assert.equal(t.steps.at(-1)!.done, false);
});

test("hashTape — 모든 스텝의 line 이 코드 범위 안이고 함수 안 줄만 켠다", () => {
  for (const c of fixture.cases) {
    for (const s of hashTape(c.names, c.target).steps) {
      assert.ok(s.line >= 2 && s.line <= HASH_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("hashTape — 빈 목록에서도 테이프가 생긴다", () => {
  assert.ok(hashTape([], "kim").steps.length >= 1);
});

test("hashTape — 사물함 상태는 이름표를 넣은 스텝에서만 늘어난다", () => {
  const t = hashTape(HASH_NAMES, HASH_TARGET);
  const filled = t.steps.map((s) => s.stage.hash!.buckets.flat().length);
  for (let i = 1; i < filled.length; i++) assert.ok(filled[i] >= filled[i - 1]);
  assert.equal(filled.at(-1), 6);
});

test("firstScanStep — 찾는 칸을 처음 훑기 시작하는 7번 줄 스텝", () => {
  const t = hashTape(HASH_NAMES, HASH_TARGET);
  const at = firstScanStep(t);
  assert.ok(at > 0);
  assert.equal(t.steps[at].line, 7);
  assert.ok(t.steps.slice(0, at).every((s) => s.line !== 7));
});

test("calcText·remText — 화면에 적는 계산 줄", () => {
  assert.equal(calcText("kim"), "k=107 + i=105 + m=109 = 321");
  assert.equal(remText("kim"), "321 ÷ 8 = 40 … 1");
  assert.equal(remText("zed"), "323 ÷ 8 = 40 … 3");
});

test("tryPlace — 맞는 칸이면 넣고, 찬 칸이면 이어 붙이고, 틀린 칸이면 이유를 말한다", () => {
  const empty = placeAll([]);
  const ok = tryPlace(empty, "kim", 1);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.buckets[1], ["kim"]);
  assert.equal(ok.clash, false);

  const withBob = placeAll(["bob"]);
  const clash = tryPlace(withBob, "zed", 3);
  assert.equal(clash.ok, true);
  assert.equal(clash.clash, true);
  assert.deepEqual(clash.buckets[3], ["bob", "zed"]);

  const bad = tryPlace(empty, "kim", 4);
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.buckets, empty);
  assert.match(bad.text, /321/);
  assert.match(bad.text, /1번 칸/);
});
