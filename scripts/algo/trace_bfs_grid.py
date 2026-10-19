"""격자 BFS 코드를 실제 Python 으로 돌려 답을 뽑는다.

화면에 보이는 코드(BFS_GRID_CODE)를 한 줄도 고치지 않고 exec 해서, JS 구현(src/lib/algo/bfs-grid.ts)의
shortestSteps 와 테이프가 같은 답을 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_bfs_grid.py
"""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "bfs-grid.json"

# src/lib/algo/bfs-grid.ts 의 BFS_GRID_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "from collections import deque",
    "",
    "def bfs(grid, start, goal):",
    "    rows, cols = len(grid), len(grid[0])",
    "    q = deque([start])",
    "    dist = {start: 0}",
    "    while q:",
    "        r, c = q.popleft()",
    "        if (r, c) == goal:",
    "            return dist[(r, c)]",
    "        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):",
    "            nr, nc = r + dr, c + dc",
    "            if not (0 <= nr < rows and 0 <= nc < cols):",
    "                continue",
    "            if grid[nr][nc] == 0 and (nr, nc) not in dist:",
    "                dist[(nr, nc)] = dist[(r, c)] + 1",
    "                q.append((nr, nc))",
    "    return -1",
]

CASES = [
    {"name": "데모 격자(길이 둘)", "grid": [[0, 1, 0, 0, 0], [0, 0, 0, 1, 0], [1, 0, 1, 0, 0], [0, 0, 0, 0, 0]], "start": [0, 0], "goal": [3, 4]},
    {"name": "돌아가는 길", "grid": [[0, 0, 0], [0, 1, 0], [0, 0, 0]], "start": [0, 0], "goal": [2, 2]},
    {"name": "벽으로 막힘", "grid": [[0, 1, 0], [0, 1, 0], [0, 1, 0]], "start": [0, 0], "goal": [0, 2]},
    {"name": "시작이 곧 도착", "grid": [[0, 0], [0, 0]], "start": [1, 1], "goal": [1, 1]},
    {"name": "시작이 벽에 둘러싸임", "grid": [[0, 1], [1, 0]], "start": [0, 0], "goal": [1, 1]},
    {"name": "한 칸짜리", "grid": [[0]], "start": [0, 0], "goal": [0, 0]},
]


def main():
    ns = {}
    exec("\n".join(CODE), ns)  # 화면에 보이는 코드 그대로 실행
    bfs = ns["bfs"]
    cases = []
    for c in CASES:
        answer = bfs(c["grid"], tuple(c["start"]), tuple(c["goal"]))
        cases.append({**c, "answer": answer})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
