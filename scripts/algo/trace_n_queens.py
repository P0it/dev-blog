"""N-퀸(백트래킹)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스와 페이지에 적은 숫자의 근거를 뽑는다.

JS 구현(src/lib/algo/n-queens.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_n_queens.py

화면 스텝은 줄 2·3·8·11·12 만 올린다(4~7 은 칸을 훑는 줄이라 한 스텝 `2` 로 묶고, 9·10 은 부르고 돌려받는 줄이다).
줄 8·11 은 퀸을 놓거나 거두는 줄이라 **줄을 실행한 뒤** 상태를 담는다(같은 호출의 다음 line 이벤트 값).
줄 2·3·12 는 상태를 바꾸지 않아 자기 이벤트 값을 그대로 쓴다.
행은 [줄, row, col(아직 없으면 None), len(cols)] 이다. 재귀라 모든 호출이 한 시퀀스에 이어진다.
"""

import json
import math
import sys
import time
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "n-queens.json"

# src/lib/algo/n-queens.ts 의 QUEENS_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def place(row, n, cols, d1, d2):",
    "    if row == n:",
    "        return True",
    "    for col in range(n):",
    "        diag, anti = row - col, row + col",
    "        if col in cols or diag in d1 or anti in d2:",
    "            continue",
    "        cols.add(col); d1.add(diag); d2.add(anti)",
    "        if place(row + 1, n, cols, d1, d2):",
    "            return True",
    "        cols.remove(col); d1.remove(diag); d2.remove(anti)",
    "    return False",
]

KEEP = {2, 3, 8, 11, 12}
AFTER = {8, 11}

CASES = [
    {"name": "N = 4 — 첫 해까지", "n": 4},
    {"name": "N = 3 — 해 없음", "n": 3},
    {"name": "N = 1", "n": 1},
    {"name": "N = 2 — 해 없음", "n": 2},
    {"name": "N = 5", "n": 5},
]


def place(row, n, cols, d1, d2):
    if row == n:
        return True
    for col in range(n):
        diag, anti = row - col, row + col
        if col in cols or diag in d1 or anti in d2:
            continue
        cols.add(col); d1.add(diag); d2.add(anti)
        if place(row + 1, n, cols, d1, d2):
            return True
        cols.remove(col); d1.remove(diag); d2.remove(anti)
    return False


FIRST_LINE = place.__code__.co_firstlineno


def trace_case(n):
    events = []  # (frame id, line, row, col, len(cols))

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "place":
            return None
        if event == "line":
            loc = frame.f_locals
            events.append((id(frame), frame.f_lineno - FIRST_LINE + 1, loc["row"], loc.get("col"), len(loc["cols"])))
        return tracer

    sys.settrace(tracer)
    try:
        place(0, n, set(), set(), set())
    finally:
        sys.settrace(None)

    rows = []
    for i, (fid, line, row, col, size) in enumerate(events):
        if line not in KEEP:
            continue
        if line in AFTER:
            # 같은 호출의 다음 line 이벤트 = 이 줄을 실행한 뒤 상태
            nxt = next(e for e in events[i + 1 :] if e[0] == fid)
            _, _, row, col, size = nxt
        rows.append([line, row, col, size])
    return rows


# ── 페이지에 적은 숫자의 근거 ──


def solutions(n, diagonals=2, remove=True):
    """해 개수. `diagonals=1` 이면 대각선 한쪽(row-col)만 검사한다. `remove=False` 면 되돌리기를 뺀다."""
    count = 0

    def go(row, cols, d1, d2):
        nonlocal count
        if row == n:
            count += 1
            return
        for col in range(n):
            if col in cols or row - col in d1 or (diagonals == 2 and row + col in d2):
                continue
            cols.add(col); d1.add(row - col)
            if diagonals == 2:
                d2.add(row + col)
            go(row + 1, cols, d1, d2)
            if remove:
                cols.discard(col); d1.discard(row - col); d2.discard(row + col)

    go(0, set(), set(), set())
    return count


def placements(n, stop_at_first):
    """퀸을 놓은 횟수(줄 7 실행 횟수). 첫 해까지, 또는 모든 해를 찾을 때까지."""
    count = 0

    def go(row, cols, d1, d2):
        nonlocal count
        if row == n:
            return True
        for col in range(n):
            if col in cols or row - col in d1 or row + col in d2:
                continue
            count += 1
            cols.add(col); d1.add(row - col); d2.add(row + col)
            if go(row + 1, cols, d1, d2) and stop_at_first:
                return True
            cols.remove(col); d1.remove(row - col); d2.remove(row + col)
        return False

    go(0, set(), set(), set())
    return count


def first_solution(n):
    cols, d1, d2 = set(), set(), set()
    board = []

    def go(row):
        if row == n:
            return True
        for col in range(n):
            if col in cols or row - col in d1 or row + col in d2:
                continue
            cols.add(col); d1.add(row - col); d2.add(row + col); board.append(col)
            if go(row + 1):
                return True
            cols.remove(col); d1.remove(row - col); d2.remove(row + col); board.pop()
        return False

    return board if go(0) else None


def no_remove_first_found(n):
    """되돌리기(remove)를 빼고 첫 해를 찾으면 어떻게 되나."""
    cols, d1, d2 = set(), set(), set()

    def go(row):
        if row == n:
            return True
        for col in range(n):
            if col in cols or row - col in d1 or row + col in d2:
                continue
            cols.add(col); d1.add(row - col); d2.add(row + col)
            if go(row + 1):
                return True
        return False

    return go(0)


def seconds(n):
    t = time.perf_counter()
    solutions(n)
    return round(time.perf_counter() - t, 3)


def main():
    cases = [{"name": c["name"], "n": c["n"], "trace": trace_case(c["n"])} for c in CASES]
    facts = {
        "solutionsByN": {str(n): solutions(n) for n in range(1, 9)},
        "firstSolution4": first_solution(4),
        "firstSolution8": first_solution(8),
        "placementsFirst4": placements(4, True),
        "placementsAll4": placements(4, False),
        "placementsFirst8": placements(8, True),
        "placementsAll8": placements(8, False),
        "choose16c4": math.comb(16, 4),
        "choose64c8": math.comb(64, 8),
        "oneDiagonal8": solutions(8, diagonals=1),
        "noRemove4Found": no_remove_first_found(4),
        "noRemove8Found": no_remove_first_found(8),
        "seconds": {"8": seconds(8), "10": seconds(10), "11": seconds(11)},
        "solutions10": solutions(10),
        "solutions11": solutions(11),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases, "facts": facts}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")
    print(json.dumps(facts, ensure_ascii=False))
    print(len(cases[0]["trace"]), "steps for N=4")


if __name__ == "__main__":
    main()
