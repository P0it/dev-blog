import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registry, byCategory, CATEGORY_ORDER, findEntry } from "./registry.ts";

test("registry — slug 가 겹치지 않는다", () => {
  const slugs = registry.map((e) => e.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("registry — ready 인 항목은 페이지 파일이 실제로 있다", () => {
  for (const e of registry.filter((x) => x.status === "ready")) {
    assert.ok(
      existsSync(`src/app/algo/${e.slug}/page.tsx`),
      `${e.slug} 는 ready 인데 페이지가 없다`,
    );
  }
});

test("registry — 모든 항목에 제목과 소제목이 있다", () => {
  for (const e of registry) {
    assert.ok(e.title.length > 0, `${e.slug} 제목 없음`);
    assert.ok(e.lede.length > 0, `${e.slug} 소제목 없음`);
  }
});

test("registry — 카테고리가 전부 CATEGORY_ORDER 안에 있다", () => {
  for (const e of registry) {
    assert.ok((CATEGORY_ORDER as readonly string[]).includes(e.category), `${e.category} 는 목록에 없다`);
  }
});

test("byCategory — CATEGORY_ORDER 순서를 지킨다", () => {
  const got = [...byCategory().keys()];
  const want = CATEGORY_ORDER.filter((c) => registry.some((e) => e.category === c));
  assert.deepEqual(got, want);
});

test("findEntry — 없는 slug 는 undefined", () => {
  assert.equal(findEntry("binary-search")?.title, "이분 탐색");
  assert.equal(findEntry("없는슬러그"), undefined);
});
