import test from "node:test";
import assert from "node:assert/strict";
import { cellClass, CELL_CLASS } from "./cell-class.ts";
import type { CellState } from "@/lib/algo/types.ts";

const STATES: CellState[] = ["current", "compare", "settled", "dropped", "out", "waiting"];

test("cellClass — 상태 6종이 각각 다른 클래스를 낸다", () => {
  const got = STATES.map(cellClass);
  assert.equal(new Set(got).size, 6);
  for (const c of got) assert.ok(c.startsWith("algo-cell-"), `${c} 접두어 없음`);
});

test("cellClass — 알 수 없는 값은 out 으로 떨어진다", () => {
  assert.equal(cellClass("없는상태" as CellState), CELL_CLASS.out);
});

test("CELL_CLASS — 상태 6종이 빠짐없이 들어 있다", () => {
  assert.deepEqual(Object.keys(CELL_CLASS).sort(), [...STATES].sort());
});
