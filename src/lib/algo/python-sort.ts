import type { StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * `sorted(cards, key=lambda c: (-c[1], c[0]))` 가 안에서 하는 일을 풀어 쓴 코드.
 * 카드마다 정렬용 값(key)을 한 번씩 만들어 카드와 짝지어 두고, key 를 작은 것부터 줄 세운 뒤 카드만 꺼낸다.
 * 진짜 `sorted` 는 key 와 카드를 한꺼번에 들고 다니며 정렬하는 쪽이라 모양은 다르지만 하는 일은 같다.
 */
export const KEY_CODE = [
  "def by_key(cards):", // 1
  "    keyed = []", // 2
  "    for name, score in cards:", // 3
  "        key = (-score, name)", // 4
  "        keyed.append((key, name, score))", // 5
  "    keyed.sort()", // 6
  "    return [(n, s) for k, n, s in keyed]", // 7
];

export type Card = { name: string; score: number };

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 카드. 같은 점수가 섞여 있어 정렬 기준의 순서가 결과를 바꾼다. */
export const CARDS: Card[] = [
  { name: "kim", score: 80 },
  { name: "lee", score: 90 },
  { name: "amy", score: 80 },
  { name: "bob", score: 70 },
  { name: "tom", score: 90 },
  { name: "zed", score: 80 },
];

/** 목표 — 점수 높은 순, 같은 점수면 이름순. */
export const TARGET_ORDER = ["lee", "tom", "amy", "kim", "zed", "bob"];

export type SortKind = "name" | "score";

/** 정렬용 값. 점수는 높은 쪽이 앞에 서야 하니 부호를 바꿔 작은 값이 앞에 오게 한다. */
export function keyOf(c: Card): [number, string] {
  return [-c.score, c.name];
}

/** 파이썬이 튜플을 찍는 모양. `(-90, 'lee')` */
export function keyText(c: Card): string {
  const [s, n] = keyOf(c);
  return `(${s}, '${n}')`;
}

function compareKeys(a: Card, b: Card): number {
  const [sa, na] = keyOf(a);
  const [sb, nb] = keyOf(b);
  if (sa !== sb) return sa < sb ? -1 : 1;
  if (na !== nb) return na < nb ? -1 : 1;
  return 0;
}

/** 안정 정렬. 같은 값이면 들어온 순서를 지킨다(번호를 같이 비교해 엔진에 맡기지 않는다). */
function stableSort(cards: Card[], cmp: (a: Card, b: Card) => number): Card[] {
  return cards
    .map((c, i) => ({ c, i }))
    .sort((x, y) => cmp(x.c, y.c) || x.i - y.i)
    .map((x) => x.c);
}

/** key 로 한 번에 줄 세운 결과. */
export function sortedByKey(cards: Card[]): Card[] {
  return stableSort(cards, compareKeys);
}

/** ① 의 버튼 하나 — 지금 줄을 한 기준으로 다시 줄 세운다. 같은 값끼리는 지금 순서를 지킨다. */
export function applySort(cards: Card[], kind: SortKind): Card[] {
  return stableSort(cards, kind === "name" ? (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : (a, b) => b.score - a.score);
}

export function orderNames(cards: Card[]): string[] {
  return cards.map((c) => c.name);
}

export function isTarget(cards: Card[]): boolean {
  return orderNames(cards).join(",") === TARGET_ORDER.join(",");
}

/**
 * 한 점수의 카드들이 점수순을 나중에 적용한 뒤 어떤 순서로 서는가.
 * `name` 은 이름순을 먼저 하고 점수순을 나중에, `original` 은 원래 줄 순서를 지킨 경우, `reverse` 는 이름 거꾸로.
 */
export function tiesAfter(mode: "name" | "original" | "reverse", score: number): string[] {
  const base =
    mode === "name"
      ? applySort(CARDS, "name")
      : mode === "reverse"
        ? [...applySort(CARDS, "name")].reverse()
        : CARDS;
  return orderNames(applySort(base, "score").filter((c) => c.score === score));
}

// ── 스텝 테이프 ──

type RowState = "todo" | "current" | "done" | "best" | "over";

const HEAD = ["이름", "점수", "key", "순서"];

function stage(rows: { cells: string[]; state: RowState }[]): StageState {
  return { cells: [], flags: {}, table: { head: HEAD, rows } };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(score: number | null, keyed: number): Record<string, number> {
  const v: Record<string, number> = {};
  if (score !== null) v.score = score;
  v.keyed = keyed;
  return v;
}

function* walk(cards: Card[]): Generator<Step> {
  const n = cards.length;
  const row = (c: Card, key: string, rank: string, state: RowState) => ({
    cells: [c.name, String(c.score), key, rank],
    state,
  });
  /** k 번째 카드까지 key 를 만든 표. cur 가 있으면 그 카드가 지금 보는 카드다. */
  const table = (made: number, cur: number | null, curKeyed: boolean) =>
    cards.map((c, i) => {
      if (i < made) return row(c, keyText(c), "·", "done");
      if (cur === i) return row(c, curKeyed ? keyText(c) : "·", "·", "current");
      return row(c, "·", "·", "todo");
    });

  yield {
    line: 2,
    vars: vars(null, 0),
    stage: stage(table(0, null, false)),
    note: "정렬용 key 를 담을 빈 목록을 만듭니다",
  };

  for (let k = 0; k < n; k++) {
    const c = cards[k];
    yield {
      line: 3,
      vars: vars(c.score, k),
      stage: stage(table(k, k, false)),
      note: `${c.name} 카드를 집습니다. 점수는 ${c.score}`,
    };
    yield {
      line: 4,
      vars: vars(c.score, k),
      stage: stage(table(k, k, true)),
      note: `key 를 만듭니다. 점수의 부호를 바꾸고 이름을 뒤에 붙여 ${keyText(c)}`,
    };
    yield {
      line: 5,
      vars: vars(c.score, k + 1),
      stage: stage(table(k + 1, null, false)),
      note: `key 와 카드를 짝지어 목록에 넣습니다 (${k + 1}번째)`,
    };
  }

  const lastScore = n > 0 ? cards[n - 1].score : null;
  yield {
    line: 3,
    vars: vars(lastScore, n),
    stage: stage(table(n, null, false)),
    note: "카드를 다 집었습니다",
  };

  const order = sortedByKey(cards);
  const sortedRows = order.map((c, i) => row(c, keyText(c), String(i + 1), "done"));
  yield {
    line: 6,
    vars: vars(lastScore, n),
    stage: stage(sortedRows),
    note: "key 를 작은 것부터 줄 세웁니다. 같은 점수는 key 의 둘째 값인 이름으로 가립니다",
  };

  yield {
    line: KEY_CODE.length,
    vars: vars(lastScore, n),
    stage: stage(sortedRows),
    note: n > 0 ? `카드만 꺼내 돌려줍니다: ${orderNames(order).join(" → ")}` : "돌려줄 카드가 없습니다",
    done: true,
  };
}

export function keyTape(cards: Card[]): Tape {
  return buildTape(walk(cards), KEY_CODE);
}
