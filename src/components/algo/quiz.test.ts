import test from "node:test";
import assert from "node:assert/strict";
import { assertOneCorrect, type QuizOption } from "./quiz-check.ts";

const OK: QuizOption[] = [
  { label: "왼쪽", correct: false },
  { label: "오른쪽", correct: true },
];

test("assertOneCorrect — 정답이 하나면 통과한다", () => {
  assert.doesNotThrow(() => assertOneCorrect(OK));
});

test("assertOneCorrect — 정답이 없으면 던진다", () => {
  assert.throws(() => assertOneCorrect([{ label: "a", correct: false }]), /정답/);
});

test("assertOneCorrect — 정답이 둘이면 던진다", () => {
  assert.throws(
    () => assertOneCorrect([{ label: "a", correct: true }, { label: "b", correct: true }]),
    /정답/,
  );
});

test("assertOneCorrect — 같은 말을 하는 선택지가 있으면 던진다", () => {
  // 실제로 겪은 결함이다. 두 선택지가 같은 뜻이면 오답이 오답이 아니다.
  assert.throws(
    () =>
      assertOneCorrect([
        { label: "오른쪽 절반이 버려진다", correct: false },
        { label: "오른쪽 절반이 버려진다", correct: true },
      ]),
    /같은/,
  );
});
