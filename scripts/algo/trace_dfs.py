"""격자 DFS(스택) 코드를 실제 Python 으로 돌려 꺼냄·넣음 시퀀스와 ⑥ 틀리는 자리의 값을 뽑는다.

화면에 보이는 코드(DFS_CODE)를 한 글자도 고치지 않고 exec 해서 settrace 로 돌린다.
JS 구현(src/lib/algo/dfs.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_dfs.py

행 모양
  ["init", 스택]                      첫 `while stack:` 직전
  ["pop", r, c, 스택, dist]           꺼낸 직후(7번 줄 직전). 스택은 꺼낸 **뒤** 길이
  ["push", r, c, 스택]                이웃을 다 넣은 뒤(다음 `while stack:` 직전)
  ["found", dist]                     도착(8번 줄)
  ["none"]                            못 찾고 끝(16번 줄)
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "dfs.json"

# src/lib/algo/dfs.ts 의 DFS_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def dfs(grid, start, goal):",
    "    rows, cols = len(grid), len(grid[0])",
    "    stack = [start]",
    "    dist = {start: 0}",
    "    while stack:",
    "        r, c = stack.pop()",
    "        if (r, c) == goal:",
    "            return dist[(r, c)]",
    "        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):",
    "            nr, nc = r + dr, c + dc",
    "            if not (0 <= nr < rows and 0 <= nc < cols):",
    "                continue",
    "            if grid[nr][nc] == 0 and (nr, nc) not in dist:",
    "                dist[(nr, nc)] = dist[(r, c)] + 1",
    "                stack.append((nr, nc))",
    "    return -1",
]

DEMO = [[0, 1, 0, 0, 0], [0, 0, 0, 1, 0], [1, 0, 1, 0, 0], [0, 0, 0, 0, 0]]

CASES = [
    {"name": "데모 격자(길이 둘)", "grid": DEMO, "start": [0, 0], "goal": [3, 4]},
    {"name": "돌아가는 길", "grid": [[0, 0, 0], [0, 1, 0], [0, 0, 0]], "start": [0, 0], "goal": [2, 2]},
    {"name": "벽으로 막힘", "grid": [[0, 1, 0], [0, 1, 0], [0, 1, 0]], "start": [0, 0], "goal": [0, 2]},
    {"name": "시작이 곧 도착", "grid": [[0, 0], [0, 0]], "start": [1, 1], "goal": [1, 1]},
    {"name": "시작이 벽에 둘러싸임", "grid": [[0, 1], [1, 0]], "start": [0, 0], "goal": [1, 1]},
    {"name": "한 칸짜리", "grid": [[0]], "start": [0, 0], "goal": [0, 0]},
]


def load(code_lines):
    ns = {}
    exec("\n".join(code_lines), ns)  # 화면에 보이는 코드 그대로 실행
    return ns["dfs"]


def trace_case(grid, start, goal):
    dfs = load(CODE)
    rows = []
    first_while = [True]

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "dfs":
            return None
        if event == "line":
            ln = frame.f_lineno  # exec 한 소스의 줄 번호 = CODE 의 1-base 줄 번호
            loc = frame.f_locals
            if ln == 5:
                if first_while[0]:
                    rows.append(["init", len(loc["stack"])])
                    first_while[0] = False
                else:
                    rows.append(["push", loc["r"], loc["c"], len(loc["stack"])])
            elif ln == 7:
                rows.append(["pop", loc["r"], loc["c"], len(loc["stack"]), loc["dist"][(loc["r"], loc["c"])]])
            elif ln == 8:
                rows.append(["found", loc["dist"][(loc["r"], loc["c"])]])
            elif ln == 16:
                rows.append(["none"])
        return tracer

    sys.settrace(tracer)
    try:
        answer = dfs(grid, tuple(start), tuple(goal))
    finally:
        sys.settrace(None)
    return answer, rows


def run_counting_pops(code_lines, grid, start, goal, cap=None):
    """답과 꺼낸 횟수. cap 에 닿으면 (None, cap) — 끝나지 않는 코드를 멈추는 장치."""
    dfs = load(code_lines)
    pops = [0]

    class Stop(Exception):
        pass

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "dfs":
            return None
        if event == "line" and frame.f_lineno == 7:  # 꺼낸 직후
            pops[0] += 1
            if cap is not None and pops[0] >= cap:
                raise Stop
        return tracer

    sys.settrace(tracer)
    try:
        answer = dfs(grid, tuple(start), tuple(goal))
    except Stop:
        answer = None
    finally:
        sys.settrace(None)
    return [answer, pops[0]]


def recursion_fact(n):
    """벽 없는 n×n 격자를 재귀 DFS 로 훑는다. 기본 재귀 한도(1000)에서 되는지."""
    sys.setrecursionlimit(1000)
    grid = [[0] * n for _ in range(n)]
    seen = set()

    def rec(r, c):
        seen.add((r, c))
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and (nr, nc) not in seen:
                rec(nr, nc)

    try:
        rec(0, 0)
        return "ok"
    except RecursionError:
        return "RecursionError"


def main():
    cases = []
    for c in CASES:
        answer, trace = trace_case(c["grid"], c["start"], c["goal"])
        cases.append({**c, "answer": answer, "trace": trace})

    # ⑥ 틀리는 자리 — 이웃 순서를 바꾸면, 방문 표시를 빼면, 재귀로 쓰면
    reversed_dirs = [line.replace("((-1,0),(1,0),(0,-1),(0,1))", "((0,1),(0,-1),(1,0),(-1,0))") for line in CODE]
    no_mark = [line.replace(" and (nr, nc) not in dist", "") for line in CODE]
    facts = {
        "order_default": run_counting_pops(CODE, DEMO, [0, 0], [3, 4]),
        "order_reversed": run_counting_pops(reversed_dirs, DEMO, [0, 0], [3, 4]),
        "no_mark": run_counting_pops(no_mark, DEMO, [0, 0], [3, 4], cap=1000),
        "recursion": {str(n): recursion_fact(n) for n in (31, 32)},
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases, "facts": facts}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases, facts={facts}")


if __name__ == "__main__":
    main()
