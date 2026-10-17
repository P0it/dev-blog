"""이분 탐색을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/binary-search.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_binary_search.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "binary-search.json"

# src/lib/algo/binary-search.ts 의 BINARY_SEARCH_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def binary_search(arr, target):",
    "    left, right = 0, len(arr) - 1",
    "    while left <= right:",
    "        mid = (left + right) // 2",
    "        if arr[mid] == target:",
    "            return mid",
    "        elif arr[mid] < target:",
    "            left = mid + 1",
    "        else:",
    "            right = mid - 1",
    "    return -1",
]

CASES = [
    {"name": "찾음", "arr": [7, 12, 19, 23, 31, 42, 55, 68, 71, 90], "target": 42},
    {"name": "못 찾음", "arr": [1, 3, 5], "target": 4},
    {"name": "빈 배열", "arr": [], "target": 1},
    {"name": "길이 1 — 찾음", "arr": [5], "target": 5},
    {"name": "길이 1 — 못 찾음", "arr": [5], "target": 9},
]


def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1


# 이 파일 안에서 binary_search 가 시작하는 줄 → CODE 의 1번 줄에 대응시킨다.
FIRST_LINE = binary_search.__code__.co_firstlineno


def trace_case(arr, target):
    """[[line, left, right, mid], …] — JS 쪽 steps 와 같은 모양."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "binary_search":
            return None
        if event == "line":
            local = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                local.get("left"),
                local.get("right"),
                local.get("mid"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        binary_search(arr, target)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = []
    for c in CASES:
        cases.append({
            "name": c["name"],
            "arr": c["arr"],
            "target": c["target"],
            "trace": trace_case(c["arr"], c["target"]),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
