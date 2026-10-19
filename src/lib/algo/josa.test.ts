import test from "node:test";
import assert from "node:assert/strict";
import { josa } from "./josa.ts";

test("josa — 마지막 자리 읽는 소리의 받침으로 고른다", () => {
  assert.equal(josa(31, "이", "가"), "31이"); // 일 → 받침
  assert.equal(josa(42, "이", "가"), "42가"); // 이 → 없음
  assert.equal(josa(10, "은", "는"), "10은"); // 십 → 받침
  assert.equal(josa(7, "을", "를"), "7을"); // 칠 → 받침
  assert.equal(josa(0, "이", "가"), "0이"); // 영 → 받침
});

test("josa — 받침 없는 끝자리는 2·4·5·9", () => {
  assert.equal(josa(2, "이", "가"), "2가");
  assert.equal(josa(4, "이", "가"), "4가");
  assert.equal(josa(25, "은", "는"), "25는");
  assert.equal(josa(9, "을", "를"), "9를");
});

test("josa — 받침 있는 끝자리는 0·1·3·6·7·8", () => {
  assert.equal(josa(3, "이", "가"), "3이");
  assert.equal(josa(6, "이", "가"), "6이");
  assert.equal(josa(8, "은", "는"), "8은");
  assert.equal(josa(100, "을", "를"), "100을");
});

test("josa — 음수도 끝자리로 고른다", () => {
  assert.equal(josa(-3, "이", "가"), "-3이");
  assert.equal(josa(-2, "이", "가"), "-2가");
});

test("josa — 으로/로 는 ㄹ 받침(1·7·8)에서 로", () => {
  assert.equal(josa(7, "으로", "로"), "7로");
  assert.equal(josa(1, "으로", "로"), "1로");
  assert.equal(josa(8, "으로", "로"), "8로");
  assert.equal(josa(10, "으로", "로"), "10으로"); // 십 → 받침 ㅂ
  assert.equal(josa(12, "으로", "로"), "12로"); // 이 → 없음
});
