"""모든 쌍 비교(중복 찾기)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/big-o.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_big_o.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "big-o.json"

# src/lib/algo/big-o.ts 의 PAIRS_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def has_duplicate(arr):",
    "    n = len(arr)",
    "    count = 0",
    "    for i in range(n):",
    "        for j in range(i + 1, n):",
    "            count += 1",
    "            if arr[i] == arr[j]:",
    "                return True",
    "    return False",
]

CASES = [
    {"name": "같은 값 없음", "arr": [4, 7, 1, 9, 3, 6]},
    {"name": "같은 값 있음", "arr": [4, 7, 1, 7, 3]},
    {"name": "빈 배열", "arr": []},
    {"name": "길이 1", "arr": [5]},
    {"name": "길이 2 — 같음", "arr": [8, 8]},
]


def has_duplicate(arr):
    n = len(arr)
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            count += 1
            if arr[i] == arr[j]:
                return True
    return False


FIRST_LINE = has_duplicate.__code__.co_firstlineno


def trace_case(arr):
    """[[line, i, j, count], …] — JS 쪽 steps 와 같은 모양."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "has_duplicate":
            return None
        if event == "line":
            local = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                local.get("i"),
                local.get("j"),
                local.get("count"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        has_duplicate(arr)
    finally:
        sys.settrace(None)

    return [r for r in rows if r[0] != 1]


def main():
    cases = [{"name": c["name"], "arr": c["arr"], "trace": trace_case(c["arr"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
