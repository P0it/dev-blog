"""팩토리얼 재귀를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/recursion.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_recursion.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "recursion.json"

# src/lib/algo/recursion.ts 의 FACTORIAL_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def factorial(n):",
    "    if n == 1:",
    "        return 1",
    "    return n * factorial(n - 1)",
]

CASES = [
    {"name": "n = 4", "n": 4},
    {"name": "n = 1 — 바로 멈춤", "n": 1},
    {"name": "n = 2", "n": 2},
    {"name": "n = 5", "n": 5},
]


def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)


FIRST_LINE = factorial.__code__.co_firstlineno


def trace_case(n):
    """[[line, n, ret], …] — line 이벤트는 ret=None, return 이벤트는 돌려주는 값."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "factorial":
            return None
        if event == "line":
            rows.append([frame.f_lineno - FIRST_LINE + 1, frame.f_locals["n"], None])
        elif event == "return":
            rows.append([frame.f_lineno - FIRST_LINE + 1, frame.f_locals["n"], arg])
        return tracer

    sys.settrace(tracer)
    try:
        factorial(n)
    finally:
        sys.settrace(None)

    return rows


def overflow_depth():
    """기저를 빠뜨리면 몇 층에서 멈추는지 — 페이지에 적은 한도 숫자의 근거."""
    def bad(n):
        return n * bad(n - 1)

    try:
        bad(5)
    except RecursionError:
        return sys.getrecursionlimit()


def main():
    cases = [{"name": c["name"], "n": c["n"], "trace": trace_case(c["n"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"code": CODE, "recursionLimit": overflow_depth(), "cases": cases},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases, limit {sys.getrecursionlimit()}")


if __name__ == "__main__":
    main()
