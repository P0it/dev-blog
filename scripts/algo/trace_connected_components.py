"""섬 세기(연결 요소) 코드를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/connected-components.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_connected_components.py

화면에 보이는 코드(CODE)를 한 줄도 고치지 않고 exec 해서 돌린다. 행은 `[줄, count, r, c, len(seen), len(q)]` 이고
**그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 None). 올리는 줄은 JS 테이프와 같다 —
6·9(땅인 칸만)·10·11·12·14·19·20. 바다 칸을 훑는 9번 줄과 나머지 줄은 건너뛴다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "connected-components.json"

# src/lib/algo/connected-components.ts 의 ISLAND_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "from collections import deque",
    "",
    "def count_islands(grid):",
    "    rows, cols = len(grid), len(grid[0])",
    "    seen = set()",
    "    count = 0",
    "    for r in range(rows):",
    "        for c in range(cols):",
    "            if grid[r][c] == 1 and (r, c) not in seen:",
    "                count += 1",
    "                seen.add((r, c))",
    "                q = deque([(r, c)])",
    "                while q:",
    "                    cr, cc = q.popleft()",
    "                    for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):",
    "                        nr, nc = cr + dr, cc + dc",
    "                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in seen:",
    "                            seen.add((nr, nc))",
    "                            q.append((nr, nc))",
    "    return count",
]

EMIT = {6, 9, 10, 11, 12, 14, 19, 20}

CASES = [
    {"name": "데모 지도(섬 3개, 대각선 한 쌍)", "grid": [[1, 1, 0, 0, 0], [1, 0, 0, 1, 0], [0, 0, 1, 1, 0], [0, 1, 0, 0, 0], [0, 1, 0, 0, 0]]},
    {"name": "바다뿐", "grid": [[0, 0, 0], [0, 0, 0]]},
    {"name": "땅뿐 — 섬 하나", "grid": [[1, 1, 1], [1, 1, 1], [1, 1, 1]]},
    {"name": "땅 한 칸", "grid": [[1]]},
    {"name": "바다 한 칸", "grid": [[0]]},
    {"name": "한 줄", "grid": [[1, 0, 1, 1]]},
    {"name": "대각선뿐 — 4방향으로는 섬 셋", "grid": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
    {"name": "고리 모양(가운데 바다)", "grid": [[1, 1, 1], [1, 0, 1], [1, 1, 1]]},
]


def make_fn():
    ns = {}
    exec(compile("\n".join(CODE), "<code>", "exec"), ns)  # 화면에 보이는 코드 그대로 실행
    return ns["count_islands"]


def trace_case(fn, grid):
    rows = []
    state = {"pending": None}

    def snapshot(line, loc):
        seen, q = loc.get("seen"), loc.get("q")
        return [
            line,
            loc.get("count"),
            loc.get("r"),
            loc.get("c"),
            None if seen is None else len(seen),
            None if q is None else len(q),
        ]

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "count_islands":
            return None
        if event in ("line", "return"):
            # 직전에 올리기로 한 줄이 실행을 마친 뒤의 변수를 이제야 읽을 수 있다
            if state["pending"] is not None:
                rows.append(snapshot(state["pending"], frame.f_locals))
                state["pending"] = None
            if event == "line" and frame.f_lineno in EMIT:
                if frame.f_lineno == 9:
                    loc = frame.f_locals
                    if grid[loc["r"]][loc["c"]] != 1:
                        return tracer  # 바다 칸은 올리지 않는다
                state["pending"] = frame.f_lineno
        return tracer

    sys.settrace(tracer)
    try:
        answer = fn(grid)
    finally:
        sys.settrace(None)
    return answer, rows


def main():
    fn = make_fn()
    cases = []
    for c in CASES:
        answer, trace = trace_case(fn, c["grid"])
        cases.append({"name": c["name"], "grid": c["grid"], "answer": answer, "trace": trace})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
