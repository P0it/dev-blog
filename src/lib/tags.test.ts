import test from "node:test";
import assert from "node:assert/strict";
import { tagKey, isSlugForm, pickCanonical, canonicalizeTags } from "./tags.ts";
import * as mjs from "../../scripts/lib/tags.mjs";

test("tagKey — 대소문자·공백·언더스코어 차이를 지운다", () => {
  assert.equal(tagKey("AI"), "ai");
  assert.equal(tagKey("Claude Code"), "claude-code");
  assert.equal(tagKey("claude_code"), "claude-code");
  assert.equal(tagKey("  Anthropic  "), "anthropic");
  // 한글은 대소문자가 없으니 공백만 바뀐다
  assert.equal(tagKey("AI 안전"), "ai-안전");
});

test("isSlugForm", () => {
  assert.equal(isSlugForm("claude-code"), true);
  assert.equal(isSlugForm("Claude Code"), false);
  assert.equal(isSlugForm("LLM"), false);
});

test("pickCanonical — 다수결이 먼저다", () => {
  assert.equal(pickCanonical([{ tag: "ai", count: 5 }, { tag: "AI", count: 2 }]), "ai");
  assert.equal(
    pickCanonical([{ tag: "anthropic", count: 3 }, { tag: "Anthropic", count: 6 }]),
    "Anthropic",
  );
});

test("pickCanonical — 동률이면 슬러그형", () => {
  assert.equal(
    pickCanonical([{ tag: "Claude Code", count: 5 }, { tag: "claude-code", count: 5 }]),
    "claude-code",
  );
});

test("canonicalizeTags — 기존 표기에 맞추고, 새 태그는 입력 표기를 살린다", () => {
  const existing = ["Anthropic", "claude-code", "ai"];
  assert.deepEqual(
    canonicalizeTags(["anthropic", "Claude Code", "AI", "새태그"], existing),
    ["Anthropic", "claude-code", "ai", "새태그"],
  );
});

test("canonicalizeTags — 빈 값과 같은 키 중복은 떨어뜨린다", () => {
  assert.deepEqual(canonicalizeTags(["ai", " ", "AI", ""], []), ["ai"]);
});

test("scripts/lib/tags.mjs 사본이 같은 답을 낸다", () => {
  const samples = ["AI", "Claude Code", "claude_code", "  Anthropic  ", "AI 안전", "llm"];
  for (const s of samples) {
    assert.equal(mjs.tagKey(s), tagKey(s), s);
    assert.equal(mjs.isSlugForm(s), isSlugForm(s), s);
  }
  const variants = [{ tag: "Claude Code", count: 5 }, { tag: "claude-code", count: 5 }];
  assert.equal(mjs.pickCanonical(variants), pickCanonical(variants));
  const existing = ["Anthropic", "claude-code", "ai"];
  const input = ["anthropic", "Claude Code", "AI", "새태그", " "];
  assert.deepEqual(mjs.canonicalizeTags(input, existing), canonicalizeTags(input, existing));
});
