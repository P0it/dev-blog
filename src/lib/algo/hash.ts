import type { StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 사물함 8칸에 이름표를 넣고 하나를 찾는 코드. 이름의 글자 번호를 모두 더해 8 로 나눈 나머지가 칸 번호다.
 * 진짜 파이썬의 `dict` 는 글자 합이 아니라 훨씬 잘 섞는 계산을 쓴다 — 이 코드는 원리만 보이는 장난감이다.
 */
export const HASH_CODE = [
  "def build_and_find(names, target):", // 1
  "    buckets = [[] for _ in range(8)]", // 2
  "    for name in names:", // 3
  "        slot = sum(ord(c) for c in name) % 8", // 4
  "        buckets[slot].append(name)", // 5
  "    slot = sum(ord(c) for c in target) % 8", // 6
  "    for who in buckets[slot]:", // 7
  "        if who == target:", // 8
  "            return True", // 9
  "    return False", // 10
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 이름. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const HASH_NAMES = ["kim", "lee", "amy", "bob", "tom", "zed"];
export const HASH_TARGET = "zed";
export const SLOTS = 8;

/** 이름의 글자 번호(영문 소문자 → 아스키 번호)를 모두 더한 값. 순서와 상관없다. */
export function codeSum(name: string): number {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return s;
}

export function slotOf(name: string): number {
  return codeSum(name) % SLOTS;
}

/** 빈 사물함 8칸. */
function emptyBuckets(): string[][] {
  return Array.from({ length: SLOTS }, () => []);
}

/** 이름을 차례로 넣은 사물함. */
export function placeAll(names: string[]): string[][] {
  const b = emptyBuckets();
  for (const n of names) b[slotOf(n)].push(n);
  return b;
}

/** 테이프 없이 찾았는지만. 비교용·테스트용. */
export function findName(names: string[], target: string): boolean {
  return placeAll(names)[slotOf(target)].includes(target);
}

const clone = (b: string[][]) => b.map((x) => [...x]);

function stage(buckets: string[][], hot?: number, name?: string, scan?: number): StageState {
  return {
    cells: [],
    flags: {},
    hash: {
      buckets: clone(buckets),
      ...(hot === undefined ? {} : { hot }),
      ...(name === undefined ? {} : { name }),
      ...(scan === undefined ? {} : { scan }),
    },
  };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(slot: number | null, filled: number | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (slot !== null) out.slot = slot;
  if (filled !== null) out.filled = filled;
  return out;
}

function* walk(names: string[], target: string): Generator<Step> {
  const buckets = emptyBuckets();
  let slot: number | null = null;
  let filled: number | null = null;
  let cur: string | undefined;
  let hot: number | undefined;
  let scan: number | undefined;
  const at = (line: number, note: string, done?: boolean): Step => ({
    line,
    vars: vars(slot, filled),
    stage: stage(buckets, hot, cur, scan),
    note,
    ...(done === undefined ? {} : { done }),
  });

  filled = 0;
  yield at(2, "빈 사물함 8칸을 만듭니다");

  for (const name of names) {
    cur = name;
    hot = undefined;
    yield at(3, `이름표 ${name} 차례입니다`);

    slot = slotOf(name);
    hot = slot;
    yield at(4, `글자 번호의 합 ${codeSum(name)} → 8로 나눈 나머지 ${slot}. ${slot}번 칸입니다`);

    const before = buckets[slot].length;
    buckets[slot].push(name);
    filled++;
    yield at(
      5,
      before === 0
        ? `${slot}번 칸이 비어 있어 그대로 넣습니다`
        : `${slot}번 칸에는 이미 이름표 ${buckets[slot].slice(0, before).join(" · ")} 가 있습니다. 같은 칸에 이어 붙입니다 (충돌)`,
    );
  }

  cur = undefined;
  hot = undefined;
  yield at(3, "넣을 이름표를 다 넣었습니다");

  cur = target;
  slot = slotOf(target);
  hot = slot;
  scan = 0;
  yield at(6, `찾는 이름 ${target}: 같은 계산으로 ${slot}번 칸 하나만 엽니다`);

  for (const who of buckets[slot]) {
    scan++;
    yield at(7, `${slot}번 칸의 ${scan}번째 이름표를 꺼내 봅니다: ${who}`);
    const same = who === target;
    yield at(8, `견줍니다 — 이름표 ${who} / 찾는 이름 ${target} → ${same ? "같다" : "다르다"}`);
    if (same) {
      yield at(9, `찾았습니다. 8칸 전부가 아니라 이 칸의 이름표 ${scan}개만 봤습니다`, true);
      return;
    }
  }

  yield at(7, `${slot}번 칸의 이름표를 다 봤습니다`);
  yield at(HASH_CODE.length, `${slot}번 칸 안에 ${target} 가 없습니다 → False`, false);
}

export function hashTape(names: string[], target: string): Tape {
  return buildTape(walk(names, target), HASH_CODE);
}

/** 찾는 칸의 이름표를 처음 꺼내 보는 7번 줄 스텝. 플레이어는 그 앞에서 멈추고 몇 개를 훑을지 묻는다. */
export function firstScanStep(tape: Tape): number {
  return tape.steps.findIndex((s) => s.line === 7);
}

// ── ① 직접 해 보기 ──

/** `k=107 + i=105 + m=109 = 321` — 이름의 글자마다 번호를 적고 더한다. */
export function calcText(name: string): string {
  const parts = [...name].map((c) => `${c}=${c.charCodeAt(0)}`);
  return `${parts.join(" + ")} = ${codeSum(name)}`;
}

/** `321 ÷ 8 = 40 … 1` — 8 로 나눈 몫과 나머지. 나머지가 칸 번호다. */
export function remText(name: string): string {
  const sum = codeSum(name);
  return `${sum} ÷ ${SLOTS} = ${Math.floor(sum / SLOTS)} … ${sum % SLOTS}`;
}

/**
 * 독자가 칸을 눌렀을 때의 판정과 그 뒤의 사물함.
 * 맞는 칸이 아니면 사물함을 그대로 두고 계산이 어떻게 그 칸을 가리키는지 말한다 —
 * 아무 칸에나 넣을 수 있으면 ② 가 말하는 "이름이 칸을 정한다" 와 어긋난다.
 */
export function tryPlace(
  buckets: string[][],
  name: string,
  clicked: number,
): { ok: boolean; buckets: string[][]; clash: boolean; text: string } {
  const slot = slotOf(name);
  if (clicked !== slot) {
    return {
      ok: false,
      buckets,
      clash: false,
      text: `${josa(codeSum(name), "을", "를")} 8로 나눈 나머지는 ${slot}입니다. ${slot}번 칸에 넣어야 합니다`,
    };
  }
  const existing = buckets[slot];
  const next = clone(buckets);
  next[slot].push(name);
  return {
    ok: true,
    buckets: next,
    clash: existing.length > 0,
    text:
      existing.length === 0
        ? `${slot}번 칸이 비어 있어 그대로 들어갔습니다`
        : `${slot}번 칸에는 이미 이름표 ${existing.join(" · ")} 가 있습니다. 같은 칸에 이어 붙였습니다`,
  };
}
