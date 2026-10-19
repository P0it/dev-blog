"""고정 길이 창의 최대 합을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/sliding-window.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_sliding_window.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "sliding-window.json"

# src/lib/algo/sliding-window.ts 의 WINDOW_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def max_window_sum(arr, k):",
    "    n = len(arr)",
    "    window = sum(arr[:k])",
    "    best = window",
    "    for i in range(k, n):",
    "        window += arr[i] - arr[i - k]",
    "        best = max(best, window)",
    "    return best",
]

CASES = [
    {"name": "열 칸·창 3", "arr": [3, 5, 2, 8, 6, 9, 1, 4, 7, 2], "k": 3},
    {"name": "창이 한 칸", "arr": [4, 9, 2], "k": 1},
    {"name": "창 크기 = 칸 수", "arr": [4, 9, 2], "k": 3},
    {"name": "창이 칸 수보다 큼", "arr": [1, 2], "k": 5},
    {"name": "빈 배열", "arr": [], "k": 3},
    {"name": "칸 하나", "arr": [5], "k": 1},
    {"name": "같은 합이 여럿", "arr": [2, 2, 2, 2], "k": 2},
]


def max_window_sum(arr, k):
    n = len(arr)
    window = sum(arr[:k])
    best = window
    for i in range(k, n):
        window += arr[i] - arr[i - k]
        best = max(best, window)
    return best


FIRST_LINE = max_window_sum.__code__.co_firstlineno


def trace_case(arr, k):
    """[[line, i, window, best], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "max_window_sum":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("i"),
                loc.get("window"),
                loc.get("best"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        max_window_sum(arr, k)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["arr"], c["k"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
