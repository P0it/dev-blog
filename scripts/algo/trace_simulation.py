"""로봇 시뮬레이션 코드를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/simulation.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_simulation.py

화면에 보이는 코드(CODE)를 한 줄도 고치지 않고 exec 해서 돌린다. 행은 `[줄, r, c, d, nr, nc, cmd]` 이고
**그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 None). 올리는 줄은 JS 테이프와 같다 — 5·6·8·9·10·12·14·15.
6번 줄(`for cmd in commands`)은 명령을 읽을 때마다, 그리고 명령이 다 떨어졌을 때 한 번 더 켜진다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "simulation.json"

# src/lib/algo/simulation.ts 의 ROBOT_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def robot(commands, grid, r, c):",
    "    rows, cols = len(grid), len(grid[0])",
    "    dr = [-1, 0, 1, 0]",
    "    dc = [0, 1, 0, -1]",
    "    d = 0",
    "    for cmd in commands:",
    '        if cmd == "F":',
    "            nr, nc = r + dr[d], c + dc[d]",
    "            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:",
    "                r, c = nr, nc",
    '        elif cmd == "R":',
    "            d = (d + 1) % 4",
    "        else:",
    "            d = (d - 1) % 4",
    "    return r, c",
]

EMIT = {5, 6, 8, 9, 10, 12, 14, 15}

ROOM = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
]

CASES = [
    {"name": "데모 방 — 벽과 바깥에 한 번씩 막힘", "grid": ROOM, "r": 3, "c": 0, "commands": "FFRFFLFF"},
    {"name": "명령 없음", "grid": ROOM, "r": 3, "c": 0, "commands": ""},
    {"name": "돌기만", "grid": ROOM, "r": 2, "c": 2, "commands": "RRLR"},
    {"name": "L 을 R 로 바꾼 명령", "grid": ROOM, "r": 3, "c": 0, "commands": "FFRFFRFF"},
    {"name": "바깥에만 막힘", "grid": ROOM, "r": 0, "c": 0, "commands": "FLFFRF"},
    {"name": "한 칸짜리 방", "grid": [[0]], "r": 0, "c": 0, "commands": "FRF"},
    {"name": "벽에 둘러싸인 시작", "grid": [[1, 1, 1], [1, 0, 1], [1, 1, 1]], "r": 1, "c": 1, "commands": "FRFRFRF"},
]


def make_fn():
    ns = {}
    exec(compile("\n".join(CODE), "<code>", "exec"), ns)  # 화면에 보이는 코드 그대로 실행
    return ns["robot"]


def trace_case(fn, case):
    rows = []
    state = {"pending": None}

    def snapshot(line, loc):
        return [line, loc.get("r"), loc.get("c"), loc.get("d"), loc.get("nr"), loc.get("nc"), loc.get("cmd")]

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "robot":
            return None
        if event in ("line", "return"):
            # 직전에 올리기로 한 줄이 실행을 마친 뒤의 변수를 이제야 읽을 수 있다
            if state["pending"] is not None:
                rows.append(snapshot(state["pending"], frame.f_locals))
                state["pending"] = None
            if event == "line" and frame.f_lineno in EMIT:
                state["pending"] = frame.f_lineno
        return tracer

    sys.settrace(tracer)
    try:
        answer = fn(case["commands"], case["grid"], case["r"], case["c"])
    finally:
        sys.settrace(None)
    return list(answer), rows


def main():
    fn = make_fn()
    cases = []
    for c in CASES:
        answer, trace = trace_case(fn, c)
        cases.append({**c, "answer": answer, "trace": trace})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
