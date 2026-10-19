"""bisect_left·bisect_right 를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/bisect-bounds.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_bisect_bounds.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "bisect-bounds.json"

# src/lib/algo/bisect-bounds.ts 의 BOUND_LEFT_CODE · BOUND_RIGHT_CODE 와 한 글자도 다르면 안 된다.
LEFT_CODE = [
    "def bisect_left(arr, x):",
    "    lo, hi = 0, len(arr)",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if arr[mid] < x:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid",
    "    return lo",
]
RIGHT_CODE = [
    l.replace("bisect_left", "bisect_right").replace("arr[mid] < x", "arr[mid] <= x") for l in LEFT_CODE
]

CASES = [
    {"name": "같은 값 셋", "arr": [1, 2, 2, 2, 3, 5], "x": 2},
    {"name": "하나뿐인 값", "arr": [1, 2, 2, 2, 3, 5], "x": 3},
    {"name": "없는 값(가운데)", "arr": [1, 2, 2, 2, 3, 5], "x": 4},
    {"name": "맨 앞보다 작음", "arr": [1, 2, 2, 2, 3, 5], "x": 0},
    {"name": "맨 뒤보다 큼", "arr": [1, 2, 2, 2, 3, 5], "x": 6},
    {"name": "빈 배열", "arr": [], "x": 1},
    {"name": "길이 1 — 같음", "arr": [5], "x": 5},
    {"name": "길이 1 — 다름", "arr": [5], "x": 9},
]


def bisect_left(arr, x):
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if arr[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


def bisect_right(arr, x):
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if arr[mid] <= x:
            lo = mid + 1
        else:
            hi = mid
    return lo


FUNCS = {"left": bisect_left, "right": bisect_right}


def trace_case(variant, arr, x):
    """[[line, lo, hi, mid], …] — JS 쪽 steps 와 같은 모양."""
    fn = FUNCS[variant]
    first = fn.__code__.co_firstlineno
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != fn.__name__:
            return None
        if event == "line":
            local = frame.f_locals
            rows.append([frame.f_lineno - first + 1, local.get("lo"), local.get("hi"), local.get("mid")])
        return tracer

    sys.settrace(tracer)
    try:
        result = fn(arr, x)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다
    return [r for r in rows if r[0] != 1], result


def main():
    cases = []
    for variant in ("left", "right"):
        for c in CASES:
            trace, result = trace_case(variant, c["arr"], c["x"])
            cases.append(
                {
                    "name": f'{variant} · {c["name"]}',
                    "variant": variant,
                    "arr": c["arr"],
                    "x": c["x"],
                    "result": result,
                    "trace": trace,
                }
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"leftCode": LEFT_CODE, "rightCode": RIGHT_CODE, "cases": cases}, ensure_ascii=False, indent=2)
        + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
