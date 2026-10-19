"""선형 탐색을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/linear-search.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_linear_search.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "linear-search.json"

# src/lib/algo/linear-search.ts 의 SEARCH_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def linear_search(arr, target):",
    "    for i in range(len(arr)):",
    "        if arr[i] == target:",
    "            return i",
    "    return -1",
]

CASES = [
    {"name": "찾음 — 아홉 번째 칸", "arr": [7, 3, 11, 5, 9, 2, 8, 12, 4, 10, 6, 1], "target": 4},
    {"name": "못 찾음", "arr": [7, 3, 11, 5, 9, 2, 8, 12, 4, 10, 6, 1], "target": 13},
    {"name": "첫 칸에서 찾음", "arr": [7, 3, 11], "target": 7},
    {"name": "마지막 칸에서 찾음", "arr": [7, 3, 11], "target": 11},
    {"name": "빈 배열", "arr": [], "target": 5},
    {"name": "길이 1 — 찾음", "arr": [5], "target": 5},
    {"name": "같은 값이 둘 — 첫 위치", "arr": [3, 8, 3], "target": 3},
]


def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1


FIRST_LINE = linear_search.__code__.co_firstlineno


def trace_case(arr, target):
    """[[line, i], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "linear_search":
            return None
        if event == "line":
            rows.append([frame.f_lineno - FIRST_LINE + 1, frame.f_locals.get("i")])
        return tracer

    sys.settrace(tracer)
    try:
        linear_search(arr, target)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["arr"], c["target"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
