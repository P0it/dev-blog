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
  {
    slug: "array-list",
    title: "배열과 리스트",
    lede: "왜 맨 앞에 끼우면 느릴까",
    category: "자료구조",
    tier: 1,
    aliases: ["list", "array", "리스트", "배열", "append", "insert", "pop(0)"],
    signals: ["맨 앞에서 넣고 뺀다", "줄(큐)을 리스트로 짠다", "반복문 안에서 in 을 쓴다"],
    status: "ready",
  },
  { slug: "stack", title: "스택", lede: "왜 Ctrl+Z 는 방금 한 것부터 되돌릴까", category: "자료구조", tier: 1, aliases: ["stack", "LIFO", "후입선출", "괄호 검사"], signals: ["괄호", "되돌리기 · 가장 최근", "같은 쌍이 안쪽부터 끝난다"], status: "ready" },
  {
    slug: "queue-deque",
    title: "큐와 덱",
    lede: "줄을 서면 앞사람부터",
    category: "자료구조",
    tier: 1,
    aliases: ["queue", "deque", "큐", "덱", "FIFO", "popleft", "collections.deque"],
    signals: ["먼저 온 순서", "BFS", "양쪽 끝에서 넣고 뺀다"],
    status: "ready",
  },
  {
    slug: "hash",
    title: "해시",
    lede: "사물함을 번호 대신 이름으로 찾기",
    category: "자료구조",
    tier: 1,
    aliases: ["dict", "set", "hash", "해시 테이블", "해시 함수", "딕셔너리", "집합", "hash table", "충돌"],
    signals: ["있는지 빨리 확인", "몇 번 나왔는지 세기", "두 수의 합"],
    status: "ready",
  },
  {
    slug: "heap",
    title: "힙(우선순위 큐)",
    lede: "가장 급한 것부터 꺼내기",
    category: "자료구조",
    tier: 1,
    aliases: ["heapq", "priority queue", "우선순위 큐", "힙"],
    signals: ["매번 최솟값", "K번째로 큰 수", "다익스트라"],
    status: "ready",
  },

  // ── 정렬
  { slug: "bubble-sort", title: "버블 정렬", lede: "옆 사람과 키 순서로 서 보기", category: "정렬", tier: 1, aliases: ["bubble sort", "거품 정렬"], signals: ["옆칸만 비교", "제자리 정렬"], status: "ready" },
  { slug: "selection-sort", title: "선택 정렬", lede: "가장 작은 것부터 꺼내 놓기", category: "정렬", tier: 1, aliases: ["selection sort", "선택정렬", "최솟값 정렬"], signals: ["n이 작다", "바꾸는 횟수를 줄여야 한다", "k번째로 작은 것까지만"], status: "ready" },
  { slug: "insertion-sort", title: "삽입 정렬", lede: "카드를 한 장씩 끼워 넣기", category: "정렬", tier: 1, aliases: ["insertion sort", "삽입정렬", "카드 끼우기"], signals: ["거의 정렬돼 있다", "n이 작다", "하나씩 들어오는 데이터를 바로 정렬해 둔다"], status: "ready" },
  { slug: "merge-sort", title: "병합 정렬", lede: "반으로 쪼갰다 붙이기", category: "정렬", tier: 1, aliases: ["merge sort", "머지 소트", "합병 정렬"], signals: ["같은 값의 순서를 지켜야 한다", "N이 커도 최악이 N log N", "정렬된 두 묶음을 합친다"], status: "ready" },
  { slug: "quick-sort", title: "퀵 정렬", lede: "기준 하나로 좌우를 가르기", category: "정렬", tier: 1, aliases: ["quick sort", "quicksort", "pivot", "피벗", "퀵소트", "분할"], signals: ["평균적으로 빠른 정렬을 직접 짠다", "k번째로 작은 수", "기준보다 작다/크다로 가르기"], status: "ready" },
  {
    slug: "python-sort",
    title: "Python sort 와 key",
    lede: "실전에서는 이 한 줄이면 된다",
    category: "정렬",
    tier: 1,
    aliases: ["sorted", "sort", "key", "lambda", "정렬 함수", "안정 정렬", "reverse", "Timsort"],
    signals: ["여러 기준으로 정렬", "정렬 기준을 직접 정한다", "N log N 이면 충분한 정렬"],
    status: "ready",
  },

  // ── 탐색
  {
    slug: "linear-search",
    title: "선형 탐색",
    lede: "앞에서부터 하나씩 보면",
    category: "탐색",
    tier: 1,
    aliases: ["linear search", "순차 탐색", "하나씩 찾기", "index", "in 연산"],
    signals: ["정렬돼 있지 않다", "한 번만 찾는다", "N이 작다"],
    status: "ready",
  },
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
  {
    slug: "bisect-bounds",
    title: "왼쪽 끝·오른쪽 끝 찾기",
    lede: "같은 값이 여러 개일 때",
    category: "탐색",
    tier: 1,
    aliases: ["bisect_left", "bisect_right", "lower bound", "upper bound", "bisect", "경계 찾기"],
    signals: ["같은 값이 여러 개", "개수를 세야 한다", "x 이상이 처음 나오는 자리"],
    status: "ready",
  },
  {
    slug: "parametric-search",
    title: "답을 이분 탐색하기",
    lede: "되는지 안 되는지만 물어보기",
    category: "탐색",
    tier: 1,
    aliases: ["parametric search", "파라메트릭 서치", "결정 문제", "답에 대한 이분 탐색", "binary search on answer"],
    signals: ["최댓값의 최솟값 · 최솟값의 최댓값", "~할 수 있는 가장 작은 값", "후보가 너무 많아 하나씩 해 볼 수 없다"],
    status: "ready",
  },

  // ── 그래프 탐색
  { slug: "bfs-grid", title: "격자 BFS", lede: "소문은 어떻게 퍼질까", category: "그래프 탐색", tier: 1, aliases: ["BFS", "너비 우선", "breadth first"], signals: ["최단 거리", "가중치 없다", "격자"], status: "ready" },
  { slug: "dfs", title: "DFS", lede: "막다른 길까지 가 보기", category: "그래프 탐색", tier: 1, aliases: ["DFS", "깊이 우선", "깊이 우선 탐색", "depth first", "depth-first search"], signals: ["모든 경로를 찾는다", "도달할 수 있는가", "한 덩어리로 이어진 곳을 찾는다"], status: "ready" },
  {
    slug: "connected-components",
    title: "연결 요소",
    lede: "섬이 몇 개인지 세기",
    category: "그래프 탐색",
    tier: 1,
    aliases: ["connected components", "연결 컴포넌트", "섬 세기", "flood fill", "number of islands"],
    signals: ["덩어리 개수", "섬·영역", "서로 이어진 것끼리 묶는다"],
    status: "ready",
  },

  // ── 최단경로
  { slug: "dijkstra", title: "다익스트라", lede: "길마다 걸리는 시간이 다르면", category: "최단경로·MST", tier: 1, aliases: ["dijkstra", "다익스트라 알고리즘", "최단 경로", "shortest path"], signals: ["길마다 걸리는 시간·비용이 다르다", "최단 거리·최소 비용", "지도·네트워크"], status: "ready" },

  // ── DP
  {
    slug: "memoization",
    title: "메모이제이션",
    lede: "같은 걸 두 번 세지 않기",
    category: "DP",
    tier: 1,
    aliases: ["memoization", "캐시", "cache", "lru_cache", "메모"],
    signals: ["같은 계산 반복", "부분 문제로 쪼개진다", "경우의 수·최댓값을 재귀로"],
    status: "ready",
  },
  {
    slug: "dp-1d",
    title: "1차원 DP",
    lede: "계단을 오르는 경우의 수",
    category: "DP",
    tier: 1,
    aliases: ["dynamic programming", "동적 계획법", "다이나믹 프로그래밍", "점화식", "dp", "계단 오르기", "피보나치"],
    signals: ["경우의 수를 센다", "앞 결과로 지금을 구한다", "n 이 크다 (1000 이상)"],
    status: "ready",
  },
  {
    slug: "knapsack",
    title: "0/1 배낭",
    lede: "가방에 무엇을 담을까",
    category: "DP",
    tier: 1,
    aliases: ["knapsack", "배낭 문제", "냅색", "0/1 knapsack", "dp 표", "무게 제한"],
    signals: ["무게(용량) 제한이 있다", "최대 가치 · 최소 비용", "물건마다 담거나 말거나"],
    status: "ready",
  },

  // ── 그리디
  {
    slug: "greedy-coins",
    title: "거스름돈",
    lede: "큰 동전부터 주면 되나",
    category: "그리디",
    tier: 1,
    aliases: ["greedy", "그리디", "탐욕", "탐욕법", "coin change", "동전", "거스름돈"],
    signals: ["최소 개수", "큰 것부터 고르면 된다 (배수 관계)", "증명할 수 있으면 그리디, 아니면 DP"],
    status: "ready",
  },
  {
    slug: "activity-selection",
    title: "회의실 배정",
    lede: "끝나는 시간이 빠른 것부터",
    category: "그리디",
    tier: 1,
    aliases: ["activity selection", "활동 선택", "회의실", "interval scheduling", "greedy"],
    signals: ["겹치지 않게 최대 개수", "회의실 배정·스케줄", "끝나는 시간 순으로 정렬"],
    status: "ready",
  },

  // ── 백트래킹·구현
  {
    slug: "permutations",
    title: "순열과 조합 만들기",
    lede: "가능한 경우를 빠짐없이",
    category: "백트래킹·구현",
    tier: 1,
    aliases: ["itertools", "permutations", "combinations", "순열", "조합", "백트래킹", "backtracking"],
    signals: ["모든 순서(순열)·모든 뽑기(조합)", "n 이 작다(10 이하)", "경우를 빠짐없이 나열"],
    status: "ready",
  },
  {
    slug: "n-queens",
    title: "N-퀸",
    lede: "서로 못 보게 놓기",
    category: "백트래킹·구현",
    tier: 1,
    aliases: ["n queens", "n-queen", "엔퀸", "백트래킹", "backtracking", "가지치기"],
    signals: ["조건을 만족하는 배치를 찾는다", "놓다가 안 되면 돌아가 다른 선택", "경우의 수는 많은데 안 되는 경우는 일찍 끊는다"],
    status: "ready",
  },
  {
    slug: "simulation",
    title: "시뮬레이션",
    lede: "시키는 대로 그대로 하기",
    category: "백트래킹·구현",
    tier: 1,
    aliases: ["구현", "델타 배열", "simulation", "implementation", "dx dy", "방향 배열"],
    signals: ["규칙이 길게 주어진다", "격자 위에서 이동한다", "시키는 대로 구현"],
    status: "ready",
  },

  // ── 문자열
  {
    slug: "string-basics",
    title: "문자열과 회문",
    lede: "뒤집어도 같은 말",
    category: "문자열",
    tier: 1,
    aliases: ["palindrome", "회문", "팰린드롬", "문자열 뒤집기", "slicing", "s[::-1]", "string"],
    signals: ["앞뒤로 읽어도 같다", "양끝에서 안쪽으로 좁힌다", "문자열을 뒤집거나 잘라 비교한다"],
    status: "ready",
  },

  // ── 수학
  plan("gcd", "최대공약수", "유클리드가 2300년 전에 푼 문제", "수학", ["gcd", "유클리드"], ["약수", "기약분수"]),
  {
    slug: "sieve",
    title: "에라토스테네스의 체",
    lede: "소수를 체로 거르기",
    category: "수학",
    tier: 1,
    aliases: ["sieve", "소수", "prime", "에라토스테네스", "소수 판별"],
    signals: ["N 이하 소수를 전부 구한다", "소수 판별을 여러 번 한다", "약수가 없는 수를 거른다"],
    status: "ready",
  },
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
