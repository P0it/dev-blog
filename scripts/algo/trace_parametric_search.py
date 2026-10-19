"""답을 이분 탐색하는 min_speed 를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/parametric-search.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_parametric_search.py

can_finish 안의 줄(2~5번)은 플레이어에서 **한 스텝으로 묶는다** — 그 안은 `hours` 에 더미별 시간을 더할 뿐이라
줄마다 켜면 스텝이 늘어 연타로 끝난다. 그래서 min_speed 줄만 추적하고, can_finish 가 끝날 때(return)의
`hours` 를 붙들어 두었다가 그 뒤 min_speed 의 행에 싣는다. 이 파일의 함수 모양(줄 사이 빈 줄 하나)은
JS 쪽 PARAM_CODE 의 줄 번호와 같아야 한다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "parametric-search.json"

# src/lib/algo/parametric-search.ts 의 PARAM_CODE 와 한 글자도 다르면 안 된다. (6번 줄은 빈 줄)
CODE = [
    "def can_finish(piles, speed, h):",
    "    hours = 0",
    "    for p in piles:",
    "        hours += (p + speed - 1) // speed",
    "    return hours <= h",
    "",
    "def min_speed(piles, h):",
    "    lo, hi = 1, max(piles)",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if can_finish(piles, mid, h):",
    "            hi = mid",
    "        else:",
    "            lo = mid + 1",
    "    return lo",
]

CASES = [
    {"name": "바나나 4더미 · 8시간", "piles": [3, 6, 7, 11], "h": 8},
    {"name": "바나나 4더미 · 11시간", "piles": [3, 6, 7, 11], "h": 11},
    {"name": "바나나 4더미 · 4시간(더미마다 1시간)", "piles": [3, 6, 7, 11], "h": 4},
    {"name": "다섯 더미 · 5시간", "piles": [30, 11, 23, 4, 20], "h": 5},
    {"name": "다섯 더미 · 6시간", "piles": [30, 11, 23, 4, 20], "h": 6},
    {"name": "한 더미", "piles": [9], "h": 3},
    {"name": "한 더미 · 속도 1 이면 충분", "piles": [1], "h": 1},
    {"name": "같은 더미 셋", "piles": [10, 10, 10], "h": 6},
]


def can_finish(piles, speed, h):
    hours = 0
    for p in piles:
        hours += (p + speed - 1) // speed
    return hours <= h

def min_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_finish(piles, mid, h):
            hi = mid
        else:
            lo = mid + 1
    return lo


FIRST = can_finish.__code__.co_firstlineno


def trace_case(piles, h):
    """[[line, lo, hi, mid, hours], …] — JS 쪽 steps 와 같은 모양."""
    rows = []
    hours_seen = {"v": None}

    def tracer(frame, event, arg):
        name = frame.f_code.co_name
        if name == "can_finish":
            if event == "return":
                hours_seen["v"] = frame.f_locals.get("hours")
            return tracer
        if name != "min_speed":
            return None
        if event == "line":
            local = frame.f_locals
            rows.append(
                [frame.f_lineno - FIRST + 1, local.get("lo"), local.get("hi"), local.get("mid"), hours_seen["v"]]
            )
        return tracer

    sys.settrace(tracer)
    try:
        result = min_speed(piles, h)
    finally:
        sys.settrace(None)

    return rows, result


def main():
    cases = []
    for c in CASES:
        trace, result = trace_case(c["piles"], c["h"])
        cases.append({"name": c["name"], "piles": c["piles"], "h": c["h"], "result": result, "trace": trace})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
