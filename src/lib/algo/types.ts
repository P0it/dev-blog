/**
 * 알고리즘 학습 탭의 스텝 테이프 타입.
 * 설계: docs/superpowers/specs/2026-10-17-algo-visualizer-design.md
 */

/** 칸·노드 하나의 상태. 색은 globals.css 토큰에 매핑한다(하드코딩 ✗). */
export type CellState =
  | "current" // 지금 보고 있는 칸
  | "compare" // 견주는 중
  | "settled" // 정렬 완료·방문 끝·확정
  | "dropped" // 범위에서 잘려 나간 것
  | "out" // 아직 안 건드린 것 / 범위 밖
  | "waiting"; // 큐·힙에서 차례를 기다리는 것

/** 그림(무대)이 한 스텝에 그릴 상태. */
export type StageState = {
  /** 칸 트랙·격자의 칸마다 상태 하나 */
  cells: CellState[];
  /** 칸 위에 꽂히는 깃발. `{ left: 0, mid: 4, right: 9 }` */
  flags: Record<string, number>;
  /** 이 스텝에서의 값들. 정렬처럼 값이 움직이는 알고리즘이 쓴다 */
  values?: number[];
  /** 레인(스택·큐·힙)에 담긴 값. 없으면 그리지 않는다 */
  queue?: number[];
  /** 칸 트랙 아래에 붙는 두 번째 줄(누적합처럼 원래 배열과 파생 배열을 같이 볼 때). 값이 모자란 칸은 빈 칸으로 그린다 */
  below?: { values: number[]; cells: CellState[]; flags: Record<string, number> };
  /** 호출 탑 — 아래가 먼저 부른 층이다. `ret` 이 있으면 그 층이 값을 돌려주며 걷히는 중이다 */
  frames?: { n: number; ret?: number }[];
};

/** 코드 한 줄이 실행된 순간. */
export type Step = {
  /** 켤 코드 줄 번호 (1-base) */
  line: number;
  /** 변수 바에 찍을 값 */
  vars: Record<string, number>;
  stage: StageState;
  /** 스텝 설명 한 줄 */
  note: string;
  /** 마지막 스텝에서만 쓴다. 찾았으면 true, 못 찾았으면 false */
  done?: boolean;
};

export type Tape = {
  steps: Step[];
  /** 화면에 보여 줄 Python 코드. 줄 번호는 1-base */
  code: string[];
  /** 색을 칠한 코드 줄(`highlightTape`). 없으면 색 없이 `code` 를 그린다 */
  html?: string[];
  /** 스텝 상한에 닿아 끊겼는지 */
  truncated: boolean;
};
