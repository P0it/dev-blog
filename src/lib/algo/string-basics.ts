import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/** 양끝에서 안쪽으로 좁히며 한 쌍씩 견주는 회문 판별 코드. */
export const PAL_CODE = [
  "def is_palindrome(s):", // 1
  "    left, right = 0, len(s) - 1", // 2
  "    while left < right:", // 3
  "        if s[left] != s[right]:", // 4
  "            return False", // 5
  "        left += 1", // 6
  "        right -= 1", // 7
  "    return True", // 8
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 단어. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const PAL_WORDS = ["기러기", "토마토", "아버지", "level", "hello", "소주만병만주소"];

/** ① 에서 먼저 예측해 보는 단어. 회문이 아니다. */
export const PAL_PREDICT_WORD = "아버지";

const chars = (s: string) => Array.from(s);

/**
 * 그림 한 장. 짝이 맞은 바깥 글자는 settled, 지금 견주는 앞 글자는 current, 뒤 글자는 compare.
 * 두 끝이 만났거나 엇갈리면 짝을 다 본 것이라 전부 settled 다. 다른 쌍은 dropped 로 남는다.
 */
function stage(cs: string[], left: number, right: number, mismatch: boolean) {
  const met = left >= right;
  const cells: CellState[] = cs.map((_, k) => {
    if (mismatch && (k === left || k === right)) return "dropped";
    if (met) return "settled";
    if (k < left || k > right) return "settled";
    if (k === left) return "current";
    if (k === right) return "compare";
    return "out";
  });
  return { cells, flags: { left, right } };
}

function* walk(s: string): Generator<Step> {
  const cs = chars(s);
  const n = cs.length;
  let left = 0;
  let right = n - 1;

  const at = (line: number, note: string, mismatch = false, done?: boolean): Step => ({
    line,
    vars: { left, right },
    stage: stage(cs, left, right, mismatch),
    note,
    ...(done === undefined ? {} : { done }),
  });

  yield at(2, n === 0 ? "글자가 한 개도 없습니다" : `글자는 ${n}개입니다. left 는 0번, right 는 ${n - 1}번 칸입니다`);

  for (;;) {
    const go = left < right;
    yield at(3, go ? "left 가 right 보다 작은 동안 되풀이합니다" : "두 끝이 만났습니다. 더 견줄 쌍이 없습니다");
    if (!go) break;

    const same = cs[left] === cs[right];
    yield at(4, `「${cs[left]}」 ↔ 「${cs[right]}」 견줍니다. ${same ? "같습니다" : "다릅니다"}`);
    if (!same) {
      yield at(5, "다른 글자가 나왔습니다. 뒤집어도 같은 말이 아닙니다", true, false);
      return;
    }

    left++;
    yield at(6, "앞쪽 끝을 한 칸 안쪽으로 옮깁니다");
    right--;
    yield at(7, "뒤쪽 끝을 한 칸 안쪽으로 옮깁니다");
  }

  yield at(PAL_CODE.length, "끝까지 다 같았습니다. 뒤집어도 같은 말입니다", false, true);
}

export function palTape(s: string): Tape {
  return buildTape(walk(s), PAL_CODE);
}

/** 테이프 없이 답만. 비교용·테스트용. */
export function isPalindrome(s: string): boolean {
  const cs = chars(s);
  let left = 0;
  let right = cs.length - 1;
  while (left < right) {
    if (cs[left] !== cs[right]) return false;
    left++;
    right--;
  }
  return true;
}

/** 글자 쌍을 몇 번 견주면 결론이 나는가. 회문은 글자 수의 절반(내림), 아니면 처음 다른 쌍까지. */
export function pairsToCheck(s: string): number {
  const cs = chars(s);
  let left = 0;
  let right = cs.length - 1;
  let checks = 0;
  while (left < right) {
    checks++;
    if (cs[left] !== cs[right]) return checks;
    left++;
    right--;
  }
  return checks;
}

/** 대소문자·공백·기호를 걸러 글자와 숫자만 남긴다. 문장은 이걸 거친 뒤에 회문을 따진다. */
export function cleanText(text: string): string {
  return chars(text)
    .filter((c) => /[\p{L}\p{N}]/u.test(c))
    .join("")
    .toLowerCase();
}

// ── ① 해 보기 ──

export type PalGuess = "same" | "differ";

export type PalState = {
  left: number;
  right: number;
  /** 맞게 판정한 횟수 */
  checks: number;
  done: boolean;
  /** 끝났을 때만 값이 있다 */
  palindrome: boolean | null;
};

/** 바깥 한 쌍에서 시작한다. 글자가 0~1 개면 견줄 쌍이 없어 시작부터 끝난 회문이다. */
export function palStart(s: string): PalState {
  const n = chars(s).length;
  const done = n <= 1;
  return { left: 0, right: n - 1, checks: 0, done, palindrome: done ? true : null };
}

/**
 * 독자가 지금 바깥 쌍을 '같다 / 다르다' 로 판정했을 때의 결과.
 * ① 에서 허용하는 동작은 회문 판별의 동작뿐이다 — 바깥 한 쌍씩 안쪽으로, 다르면 거기서 끝.
 * 틀리게 판정하면 상태를 그대로 두고 **왜 틀렸는지** 말한다.
 */
export function palJudge(s: string, st: PalState, guess: PalGuess): { ok: boolean; text: string; next: PalState } {
  const cs = chars(s);
  const a = cs[st.left];
  const b = cs[st.right];
  const same = a === b;
  const pair = `「${a}」 ↔ 「${b}」`;

  if (guess === "same" && !same) {
    return {
      ok: false,
      text: `${pair} 서로 다른 글자입니다. 한 쌍이라도 다르면 뒤집어 읽을 때 달라집니다`,
      next: st,
    };
  }
  if (guess === "differ" && same) {
    return {
      ok: false,
      text: `${pair} 같은 글자입니다. 앞에서 읽은 글자와 뒤에서 읽은 글자가 똑같습니다`,
      next: st,
    };
  }

  if (!same) {
    return {
      ok: true,
      text: `${pair} 다른 글자입니다. 여기서 끝, 뒤집어 읽으면 달라집니다`,
      next: { ...st, checks: st.checks + 1, done: true, palindrome: false },
    };
  }

  const left = st.left + 1;
  const right = st.right - 1;
  const checks = st.checks + 1;
  if (left >= right) {
    const text =
      left === right
        ? `${pair} 같은 글자입니다. 가운데 글자 「${cs[left]}」 는 짝이 없어 건너뜁니다`
        : `${pair} 같은 글자입니다. 짝을 모두 견줬습니다`;
    return { ok: true, text, next: { left, right, checks, done: true, palindrome: true } };
  }
  return {
    ok: true,
    text: `${pair} 같은 글자입니다. 안쪽 한 쌍으로 갑니다`,
    next: { left, right, checks, done: false, palindrome: null },
  };
}
