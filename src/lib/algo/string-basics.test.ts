import test from "node:test";
import assert from "node:assert/strict";
import {
  PAL_CODE,
  PAL_WORDS,
  PAL_PREDICT_WORD,
  palTape,
  isPalindrome,
  pairsToCheck,
  palStart,
  palJudge,
  cleanText,
} from "./string-basics.ts";
import fixture from "./fixtures/string-basics.json" with { type: "json" };

// fixture 는 scripts/algo/trace_string_basics.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("PAL_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PAL_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = palTape(c.s);
    const mine = t.steps.map((s) => [s.line, s.vars.left ?? null, s.vars.right ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("isPalindrome — Python 결과와 같고, 뒤집은 문자열과 같은지와도 같다", () => {
  for (const c of fixture.cases) {
    assert.equal(isPalindrome(c.s), c.result, c.name);
    assert.equal(isPalindrome(c.s), c.s === Array.from(c.s).reverse().join(""), c.name);
  }
});

test("palTape — 끝 스텝의 done 이 결과와 같다(빈 문자열·한 글자는 회문)", () => {
  for (const c of fixture.cases) {
    assert.equal(palTape(c.s).steps.at(-1)!.done, c.result, c.name);
  }
  assert.equal(palTape("").steps.at(-1)!.done, true);
  assert.equal(palTape("가").steps.at(-1)!.done, true);
});

test("palTape — 모든 스텝의 line 이 코드 범위 안이고 상한 안에 끝난다", () => {
  for (const w of [...PAL_WORDS, "", "a", "abca", "abba"]) {
    const t = palTape(w);
    for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= PAL_CODE.length, `${w}: line ${s.line} 범위 밖`);
    assert.equal(t.truncated, false);
  }
});

test("palTape — 회문이면 끝에 전부 settled, 다르면 다른 쌍이 dropped 로 남는다", () => {
  const ok = palTape("기러기").steps.at(-1)!;
  assert.ok(ok.stage.cells.every((c) => c === "settled"));
  const bad = palTape("아버지").steps.at(-1)!;
  assert.equal(bad.stage.cells[0], "dropped");
  assert.equal(bad.stage.cells[2], "dropped");
  assert.equal(bad.stage.cells[1], "out");
});

test("palTape — 시작 스텝에는 아직 확정된 글자가 없다", () => {
  const first = palTape("기러기").steps[0];
  assert.ok(first.stage.cells.every((c) => c !== "settled" && c !== "dropped"));
});

test("palTape — 스텝 설명에 undefined 가 없고 비어 있지 않다", () => {
  for (const w of PAL_WORDS) {
    for (const s of palTape(w).steps) {
      assert.ok(s.note.length > 0);
      assert.ok(!s.note.includes("undefined"), `${w}: ${s.note}`);
    }
  }
});

test("pairsToCheck — 회문은 글자 수의 절반(내림), 아니면 처음 다른 쌍까지", () => {
  assert.equal(pairsToCheck("기러기"), 1);
  assert.equal(pairsToCheck("소주만병만주소"), 3);
  assert.equal(pairsToCheck("abba"), 2);
  assert.equal(pairsToCheck("아버지"), 1);
  assert.equal(pairsToCheck("abca"), 2);
  assert.equal(pairsToCheck(""), 0);
  assert.equal(pairsToCheck("a"), 0);
});

test("PAL_WORDS — 예측 단어는 목록에 있고 회문이 아니다", () => {
  assert.ok(PAL_WORDS.includes(PAL_PREDICT_WORD));
  assert.equal(isPalindrome(PAL_PREDICT_WORD), false);
  assert.ok(PAL_WORDS.some((w) => isPalindrome(w)), "회문도 하나는 있어야 한다");
});

// ── ① 해 보기: 바깥 한 쌍씩 안쪽으로 ──

test("palJudge — 기러기는 같다 한 번에 가운데만 남아 회문으로 끝난다", () => {
  const st = palStart("기러기");
  assert.deepEqual([st.left, st.right, st.done], [0, 2, false]);
  const r = palJudge("기러기", st, "same");
  assert.equal(r.ok, true);
  assert.equal(r.next.done, true);
  assert.equal(r.next.palindrome, true);
  assert.equal(r.next.checks, 1);
});

test("palJudge — 짝수 길이는 마지막 쌍 뒤에 두 끝이 엇갈려 끝난다", () => {
  let st = palStart("abba");
  st = palJudge("abba", st, "same").next;
  assert.deepEqual([st.left, st.right, st.done], [1, 2, false]);
  st = palJudge("abba", st, "same").next;
  assert.equal(st.done, true);
  assert.equal(st.palindrome, true);
  assert.equal(st.checks, 2);
});

test("palJudge — 다른 쌍을 다르다고 하면 거기서 끝나고 회문이 아니다", () => {
  const r = palJudge("아버지", palStart("아버지"), "differ");
  assert.equal(r.ok, true);
  assert.equal(r.next.done, true);
  assert.equal(r.next.palindrome, false);
  assert.equal(r.next.checks, 1);
});

test("palJudge — 틀리게 판정하면 상태는 그대로이고 이유가 나온다", () => {
  const st = palStart("아버지");
  const r = palJudge("아버지", st, "same");
  assert.equal(r.ok, false);
  assert.deepEqual(r.next, st);
  assert.match(r.text, /다릅니다|다른/);

  const st2 = palStart("기러기");
  const r2 = palJudge("기러기", st2, "differ");
  assert.equal(r2.ok, false);
  assert.deepEqual(r2.next, st2);
  assert.match(r2.text, /같은 글자/);
});

test("palStart — 빈 문자열과 한 글자는 시작부터 끝난 회문이다", () => {
  for (const w of ["", "가"]) {
    const st = palStart(w);
    assert.equal(st.done, true);
    assert.equal(st.palindrome, true);
    assert.equal(st.checks, 0);
  }
});

test("palJudge — 모든 단어를 끝까지 풀면 isPalindrome 과 같은 결론이고 판정 횟수가 pairsToCheck 와 같다", () => {
  for (const w of PAL_WORDS) {
    let st = palStart(w);
    let guard = 0;
    while (!st.done && guard++ < 50) {
      const same = Array.from(w)[st.left] === Array.from(w)[st.right];
      st = palJudge(w, st, same ? "same" : "differ").next;
    }
    assert.equal(st.palindrome, isPalindrome(w), w);
    assert.equal(st.checks, pairsToCheck(w), w);
  }
});

// ── ⑥ 틀리는 자리 ──

test("cleanText — 대소문자·공백·기호를 걸러야 문장이 회문이 된다", () => {
  const sentence = "A man, a plan, a canal: Panama";
  assert.equal(isPalindrome(sentence), false);
  assert.equal(cleanText(sentence), "amanaplanacanalpanama");
  assert.equal(isPalindrome(cleanText(sentence)), true);
});

test("left <= right 로 써도 결과는 같다 — 가운데 글자를 자기 자신과 한 번 더 견줄 뿐이다", () => {
  const le = (s: string) => {
    const a = Array.from(s);
    let l = 0;
    let r = a.length - 1;
    while (l <= r) {
      if (a[l] !== a[r]) return false;
      l++;
      r--;
    }
    return true;
  };
  const alphabet = "abc";
  for (let n = 0; n <= 6; n++) {
    const total = alphabet.length ** n;
    for (let k = 0; k < total; k++) {
      let s = "";
      let x = k;
      for (let i = 0; i < n; i++) {
        s += alphabet[x % alphabet.length];
        x = Math.floor(x / alphabet.length);
      }
      assert.equal(le(s), isPalindrome(s), s);
    }
  }
});
