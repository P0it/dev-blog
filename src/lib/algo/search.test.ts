import test from "node:test";
import assert from "node:assert/strict";
import { filterEntries, chosung } from "./search.ts";
import { registry } from "../../content/algo/registry.ts";

const ids = (rows: { slug: string }[]) => rows.map((r) => r.slug);

test("chosung — 한글에서 초성만 뽑는다", () => {
  assert.equal(chosung("이분 탐색"), "ㅇㅂㅌㅅ");
  assert.equal(chosung("버블 정렬"), "ㅂㅂㅈㄹ");
  // 한글이 아닌 글자는 그대로 둔다
  assert.equal(chosung("BFS 격자"), "bfsㄱㅈ");
});

test("filterEntries — 빈 질의는 전체를 돌려준다", () => {
  assert.equal(filterEntries(registry, "").length, registry.length);
  assert.equal(filterEntries(registry, "   ").length, registry.length);
});

test("filterEntries — 제목으로 찾는다", () => {
  assert.ok(ids(filterEntries(registry, "이분")).includes("binary-search"));
});

test("filterEntries — 영어 별칭으로 찾는다", () => {
  assert.ok(ids(filterEntries(registry, "binary")).includes("binary-search"));
  assert.ok(ids(filterEntries(registry, "bisect")).includes("binary-search"));
});

test("filterEntries — 초성으로 찾는다", () => {
  assert.ok(ids(filterEntries(registry, "ㅇㅂㅌㅅ")).includes("binary-search"));
});

test("filterEntries — 신호 칩으로도 찾는다", () => {
  assert.ok(ids(filterEntries(registry, "정렬돼")).includes("binary-search"));
});

test("filterEntries — 대소문자를 가리지 않는다", () => {
  assert.deepEqual(ids(filterEntries(registry, "BINARY")), ids(filterEntries(registry, "binary")));
});

test("filterEntries — 없는 말이면 빈 배열", () => {
  assert.deepEqual(filterEntries(registry, "존재하지않는말zzz"), []);
});
