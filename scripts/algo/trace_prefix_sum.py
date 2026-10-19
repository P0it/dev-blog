"""구간 합(누적합)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/prefix-sum.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_prefix_sum.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "prefix-sum.json"

# src/lib/algo/prefix-sum.ts 의 PREFIX_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def range_sum(arr, left, right):",
    "    prefix = [0]",
    "    for i in range(len(arr)):",
    "        prefix.append(prefix[i] + arr[i])",
    "    ans = prefix[right + 1] - prefix[left]",
    "    return ans",
]

CASES = [
    {"name": "10칸 — 2번~6번", "arr": [3, 1, 4, 1, 5, 9, 2, 6, 5, 3], "left": 2, "right": 6},
    {"name": "10칸 — 처음부터(left=0)", "arr": [3, 1, 4, 1, 5, 9, 2, 6, 5, 3], "left": 0, "right": 9},
    {"name": "빈 배열", "arr": [], "left": 0, "right": -1},
    {"name": "한 칸", "arr": [7], "left": 0, "right": 0},
    {"name": "세 칸 — 1번~2번", "arr": [3, 1, 4], "left": 1, "right": 2},
]


def range_sum(arr, left, right):
    prefix = [0]
    for i in range(len(arr)):
        prefix.append(prefix[i] + arr[i])
    ans = prefix[right + 1] - prefix[left]
    return ans


FIRST_LINE = range_sum.__code__.co_firstlineno


def trace_case(arr, left, right):
    """[[line, i, ans], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "range_sum":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([frame.f_lineno - FIRST_LINE + 1, loc.get("i"), loc.get("ans")])
        return tracer

    sys.settrace(tracer)
    try:
        range_sum(arr, left, right)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["arr"], c["left"], c["right"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
