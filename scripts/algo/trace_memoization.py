"""메모이제이션(수첩을 쓰는 fib)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/memoization.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_memoization.py

화면 스텝은 줄 2·3·5·7·8 만 올린다(4 와 6 은 조건 줄·돌려주는 줄이라 건너뛴다. 올리면 47스텝이 된다).
line 이벤트는 줄을 실행하기 **전**에 찍히므로 `len(memo)` 도 그 줄 실행 전의 수첩 크기다.
"""

import json
import sys
import time
from functools import lru_cache
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "memoization.json"

# src/lib/algo/memoization.ts 의 MEMO_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def fib(n, memo):",
    "    if n in memo:",
    "        return memo[n]",
    "    if n < 2:",
    "        memo[n] = n",
    "        return n",
    "    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)",
    "    return memo[n]",
]

KEEP = {2, 3, 5, 7, 8}

CASES = [
    {"name": "n = 6", "n": 6},
    {"name": "n = 5", "n": 5},
    {"name": "n = 2", "n": 2},
    {"name": "n = 1 — 바로 멈춤", "n": 1},
    {"name": "n = 0", "n": 0},
]


def fib(n, memo):
    if n in memo:
        return memo[n]
    if n < 2:
        memo[n] = n
        return n
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]


FIRST_LINE = fib.__code__.co_firstlineno


def depth_of(frame):
    d = 0
    while frame is not None and frame.f_code.co_name == "fib":
        d += 1
        frame = frame.f_back
    return d


def trace_case(n):
    """[[line, n, len(memo), 호출 탑 높이], …] — 줄 2·3·5·7·8 의 line 이벤트만."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "fib":
            return None
        if event == "line":
            line = frame.f_lineno - FIRST_LINE + 1
            if line in KEEP:
                rows.append([line, frame.f_locals["n"], len(frame.f_locals["memo"]), depth_of(frame)])
        return tracer

    sys.settrace(tracer)
    try:
        fib(n, {})
    finally:
        sys.settrace(None)
    return rows


# ── 페이지에 적은 숫자의 근거 ──


def plain_calls(n):
    """수첩 없이 부른 호출 횟수."""
    count = 0

    def f(k):
        nonlocal count
        count += 1
        return k if k < 2 else f(k - 1) + f(k - 2)

    f(n)
    return count


def memo_calls(n):
    """수첩을 쓰고 부른 호출 횟수와 실제로 계산한(수첩에 새로 적은) 횟수."""
    calls = computes = 0
    memo = {}

    def f(k):
        nonlocal calls, computes
        calls += 1
        if k in memo:
            return memo[k]
        computes += 1
        memo[k] = k if k < 2 else f(k - 1) + f(k - 2)
        return memo[k]

    f(n)
    return calls, computes


def new_memo_each_call_calls(n):
    """수첩을 함수 안에서 만들면(`memo = {}` 가 안에 있으면) 호출 횟수는 수첩이 없을 때와 같다."""
    count = 0

    def f(k):
        nonlocal count
        count += 1
        memo = {}  # 부를 때마다 새로 만든다
        if k in memo:
            return memo[k]
        memo[k] = k if k < 2 else f(k - 1) + f(k - 2)
        return memo[k]

    f(n)
    return count


def recursion_error_n():
    """수첩을 써도 재귀라서 깊이 한도에 걸리는 n — 페이지에 적은 5000 이 실제로 터지는지."""
    try:
        fib(5000, {})
    except RecursionError:
        return "RecursionError"
    return "ok"


def unhashable_message():
    @lru_cache(maxsize=None)
    def total(xs):
        return sum(xs)

    try:
        total([1, 2, 3])
    except TypeError as e:
        return str(e)
    return ""


def impure_demo():
    """돌려주는 값이 바뀌는 함수에 캐시를 걸면 처음 값만 계속 나온다."""
    counter = [0]

    @lru_cache(maxsize=None)
    def tick():
        counter[0] += 1
        return counter[0]

    return [tick(), tick(), tick()], counter[0]


def lru_cache_result():
    @lru_cache(maxsize=None)
    def f(n):
        return n if n < 2 else f(n - 1) + f(n - 2)

    return f(6)


def measured_seconds():
    """컴퓨터마다 다르다 — 비율만 본다. 테스트가 비교하지 않는다."""

    def f(k):
        return k if k < 2 else f(k - 1) + f(k - 2)

    t = time.perf_counter()
    f(32)
    plain = time.perf_counter() - t

    t = time.perf_counter()
    fib(32, {})
    memo = time.perf_counter() - t
    return {"n": 32, "plainSeconds": round(plain, 3), "memoSeconds": round(memo, 6)}


def main():
    cases = [{"name": c["name"], "n": c["n"], "trace": trace_case(c["n"])} for c in CASES]
    calls30, computes30 = memo_calls(30)
    calls6, computes6 = memo_calls(6)
    calls7, computes7 = memo_calls(7)
    ticks, tick_runs = impure_demo()
    facts = {
        "plainCalls6": plain_calls(6),
        "plainCalls30": plain_calls(30),
        "memoCalls6": calls6,
        "memoComputes6": computes6,
        "memoCalls7": calls7,
        "memoComputes7": computes7,
        "memoCalls30": calls30,
        "memoComputes30": computes30,
        "newMemoEachCall20": new_memo_each_call_calls(20),
        "sharedMemoCalls20": memo_calls(20)[0],
        "depthError5000": recursion_error_n(),
        "recursionLimit": sys.getrecursionlimit(),
        "unhashable": unhashable_message(),
        "impureTicks": ticks,
        "impureRuns": tick_runs,
        "lruCacheFib6": lru_cache_result(),
        "measured": measured_seconds(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases, "facts": facts}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
