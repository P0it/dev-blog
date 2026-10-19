"""투 포인터(양끝에서 좁히기)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/two-pointers.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_two_pointers.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "two-pointers.json"

# src/lib/algo/two-pointers.ts 의 PAIR_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def has_pair(arr, target):",
    "    left, right = 0, len(arr) - 1",
    "    while left < right:",
    "        total = arr[left] + arr[right]",
    "        if total == target:",
    "            return True",
    "        elif total < target:",
    "            left += 1",
    "        else:",
    "            right -= 1",
    "    return False",
]

CASES = [
    {"name": "찾음", "arr": [1, 3, 4, 6, 8, 10, 13], "target": 13},
    {"name": "쌍 없음", "arr": [1, 3, 4, 6, 8, 10, 13], "target": 15},
    {"name": "정렬 안 됨 — 놓침", "arr": [3, 9, 10, 1], "target": 13},
    {"name": "빈 배열", "arr": [], "target": 5},
    {"name": "길이 1", "arr": [5], "target": 5},
    {"name": "첫 합이 목표", "arr": [2, 5, 9], "target": 11},
]


def has_pair(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        total = arr[left] + arr[right]
        if total == target:
            return True
        elif total < target:
            left += 1
        else:
            right -= 1
    return False


FIRST_LINE = has_pair.__code__.co_firstlineno


def trace_case(arr, target):
    """[[line, left, right, total], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "has_pair":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("left"),
                loc.get("right"),
                loc.get("total"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        has_pair(arr, target)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
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
