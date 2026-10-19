/**
 * 알고리즘 학습 탭의 목록. **사이드바 순서가 곧 학습 순서다.**
 *
 * 범위는 코딩테스트 출제 빈도로 짰다(설계 5절). 단위는 알고리즘이 아니라 **개념**이라
 * "이분 탐색" 하나가 여러 쪽으로 갈린다. 한 쪽은 3~5분.
 *
 * `status: "ready"` 는 `src/app/algo/<slug>/page.tsx` 가 있어야 한다 — 테스트가 막는다.
 */

export type AlgoEntry = {
  slug: string;
  /** 제목 = 알고리즘 이름. 사이드바에도 이 이름이 뜬다 */
  title: string;
  /** 소제목 = 독자가 이미 해 본 장면. 읽을 이유를 만드는 자리 */
  lede: string;
  category: string;
  tier: 1 | 2 | 3;
  /** 검색에 걸릴 다른 이름 — 한글·영어·함수명 */
  aliases: string[];
  /** 이 알고리즘을 꺼내라는 문제의 신호. 검색에도 걸린다 */
  signals: string[];
  status: "ready" | "planned";
};

export const CATEGORY_ORDER = [
  "기초 개념",
  "자료구조",
  "정렬",
  "탐색",
  "그래프 탐색",
  "최단경로·MST",
  "DP",
  "그리디",
  "백트래킹·구현",
  "문자열",
  "수학",
] as const;

const plan = (
  slug: string,
  title: string,
  lede: string,
  category: string,
  aliases: string[] = [],
  signals: string[] = [],
): AlgoEntry => ({ slug, title, lede, category, tier: 1, aliases, signals, status: "planned" });

export const registry: AlgoEntry[] = [
  // ── 기초 개념
  { slug: "big-o", title: "시간복잡도", lede: "1억 번이면 1초, 그래서 어쩌라고", category: "기초 개념", tier: 1, aliases: ["Big-O", "빅오", "time complexity"], signals: ["N이 얼마까지", "제한 시간 1~2초", "반복문 안의 반복문"], status: "ready" },
  { slug: "recursion", title: "재귀", lede: "거울 앞에 거울을 두면", category: "기초 개념", tier: 1, aliases: ["recursion", "재귀 함수", "재귀호출"], signals: ["같은 모양의 더 작은 문제", "점화식이 주어진다", "폴더·트리처럼 안에 같은 것이 든다"], status: "ready" },
  { slug: "brute-force", title: "완전탐색", lede: "일단 다 해 보면 안 되나", category: "기초 개념", tier: 1, aliases: ["brute force", "전수 조사", "exhaustive search", "itertools"], signals: ["N이 작다", "모든 경우", "조건을 만족하는 것 중 최선"], status: "ready" },
  { slug: "two-pointers", title: "투 포인터", lede: "양쪽에서 좁혀 오기", category: "기초 개념", tier: 1, aliases: ["two pointers", "투포인터", "양끝 포인터"], signals: ["정렬돼 있다", "두 수의 합", "양끝에서 좁힌다"], status: "ready" },
  {
    slug: "sliding-window",
    title: "슬라이딩 윈도우",
    lede: "창문을 밀면서 보기",
    category: "기초 개념",
    tier: 1,
    aliases: ["sliding window", "슬라이딩윈도우", "고정 길이 구간", "window"],
    signals: ["연속한 구간", "길이가 k 로 정해져 있다", "최대·최소 구간 합"],
    status: "ready",
  },
  { slug: "prefix-sum", title: "누적합", lede: "구간의 합을 한 번 빼기로", category: "기초 개념", tier: 1, aliases: ["prefix sum", "구간 합", "부분합", "psum"], signals: ["구간의 합을 여러 번", "값은 안 바뀐다", "칸 수와 질문 수가 둘 다 크다"], status: "ready" },

  // ── 자료구조
  plan("array-list", "배열과 리스트", "왜 맨 앞에 끼우면 느릴까", "자료구조", ["list"], []),
  plan("stack", "스택", "왜 Ctrl+Z 는 방금 한 것부터 되돌릴까", "자료구조", ["stack"], ["괄호", "되돌리기"]),
  plan("queue-deque", "큐와 덱", "줄을 서면 앞사람부터", "자료구조", ["queue", "deque"], ["먼저 온 순서"]),
  plan("hash", "해시", "사물함을 번호 대신 이름으로 찾기", "자료구조", ["dict", "set", "hash"], ["있는지 빨리 확인"]),
  plan("heap", "힙(우선순위 큐)", "가장 급한 것부터 꺼내기", "자료구조", ["heapq", "priority queue"], ["매번 최솟값"]),

  // ── 정렬
  { slug: "bubble-sort", title: "버블 정렬", lede: "옆 사람과 키 순서로 서 보기", category: "정렬", tier: 1, aliases: ["bubble sort", "거품 정렬"], signals: ["옆칸만 비교", "제자리 정렬"], status: "ready" },
  plan("selection-sort", "선택 정렬", "가장 작은 것부터 꺼내 놓기", "정렬", ["selection sort"], []),
  plan("insertion-sort", "삽입 정렬", "카드를 한 장씩 끼워 넣기", "정렬", ["insertion sort"], ["거의 정렬돼 있다"]),
  plan("merge-sort", "병합 정렬", "반으로 쪼갰다 붙이기", "정렬", ["merge sort"], []),
  plan("quick-sort", "퀵 정렬", "기준 하나로 좌우를 가르기", "정렬", ["quick sort", "pivot"], []),
  plan("python-sort", "Python sort 와 key", "실전에서는 이 한 줄이면 된다", "정렬", ["sorted", "key", "lambda"], ["여러 기준으로 정렬"]),

  // ── 탐색
  plan("linear-search", "선형 탐색", "앞에서부터 하나씩 보면", "탐색", ["linear search"], []),
  {
    slug: "binary-search",
    title: "이분 탐색",
    lede: "업-다운 게임 잘하는 법",
    category: "탐색",
    tier: 1,
    aliases: ["binary search", "이진 탐색", "bisect"],
    signals: ["정렬돼 있다", "값 하나를 찾는다", "N이 너무 크다"],
    status: "ready",
  },
  plan("bisect-bounds", "왼쪽 끝·오른쪽 끝 찾기", "같은 값이 여러 개일 때", "탐색", ["bisect_left", "bisect_right", "lower bound"], ["같은 값이 여러 개"]),
  plan("parametric-search", "답을 이분 탐색하기", "되는지 안 되는지만 물어보기", "탐색", ["parametric search"], ["최댓값의 최솟값"]),

  // ── 그래프 탐색
  { slug: "bfs-grid", title: "격자 BFS", lede: "소문은 어떻게 퍼질까", category: "그래프 탐색", tier: 1, aliases: ["BFS", "너비 우선", "breadth first"], signals: ["최단 거리", "가중치 없다", "격자"], status: "ready" },
  plan("dfs", "DFS", "막다른 길까지 가 보기", "그래프 탐색", ["DFS", "깊이 우선"], ["모든 경로"]),
  plan("connected-components", "연결 요소", "섬이 몇 개인지 세기", "그래프 탐색", ["connected components"], ["덩어리 개수"]),

  // ── 최단경로
  plan("dijkstra", "다익스트라", "길마다 걸리는 시간이 다르면", "최단경로·MST", ["dijkstra"], ["가중치 있다", "최단 거리"]),

  // ── DP
  plan("memoization", "메모이제이션", "같은 걸 두 번 세지 않기", "DP", ["memoization", "캐시"], ["같은 계산 반복"]),
  plan("dp-1d", "1차원 DP", "계단을 오르는 경우의 수", "DP", ["dynamic programming"], ["경우의 수"]),
  plan("knapsack", "0/1 배낭", "가방에 무엇을 담을까", "DP", ["knapsack"], ["무게 제한", "최대 가치"]),

  // ── 그리디
  plan("greedy-coins", "거스름돈", "큰 동전부터 주면 되나", "그리디", ["greedy"], ["최소 개수"]),
  plan("activity-selection", "회의실 배정", "끝나는 시간이 빠른 것부터", "그리디", ["activity selection"], ["겹치지 않게 최대"]),

  // ── 백트래킹·구현
  plan("permutations", "순열과 조합 만들기", "가능한 경우를 빠짐없이", "백트래킹·구현", ["itertools", "permutations"], ["모든 순서"]),
  plan("n-queens", "N-퀸", "서로 못 보게 놓기", "백트래킹·구현", ["n queens", "백트래킹"], ["조건을 만족하는 배치"]),
  plan("simulation", "시뮬레이션", "시키는 대로 그대로 하기", "백트래킹·구현", ["구현", "델타 배열"], ["규칙이 길게 주어진다"]),

  // ── 문자열
  plan("string-basics", "문자열과 회문", "뒤집어도 같은 말", "문자열", ["palindrome"], ["뒤집기"]),

  // ── 수학
  plan("gcd", "최대공약수", "유클리드가 2300년 전에 푼 문제", "수학", ["gcd", "유클리드"], ["약수", "기약분수"]),
  plan("sieve", "에라토스테네스의 체", "소수를 체로 거르기", "수학", ["sieve", "소수"], ["소수 판별", "N까지 전부"]),
];

export function byCategory(): Map<string, AlgoEntry[]> {
  const map = new Map<string, AlgoEntry[]>();
  for (const c of CATEGORY_ORDER) {
    const rows = registry.filter((e) => e.category === c);
    if (rows.length) map.set(c, rows);
  }
  return map;
}

export function findEntry(slug: string): AlgoEntry | undefined {
  return registry.find((e) => e.slug === slug);
}
