"""0/1 배낭을 실제 Python 으로 돌려 줄 번호·변수·표 시퀀스를 뽑는다.

JS 구현(src/lib/algo/knapsack.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

fixture 의 `facts` 는 ⑥ 틀리는 자리에 적은 값을 실제 Python 으로 확인한 것이다.

    python scripts/algo/trace_knapsack.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "knapsack.json"

# src/lib/algo/knapsack.ts 의 KNAP_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def knapsack(items, W):",
    "    n = len(items)",
    "    dp = [[0] * (W + 1) for _ in range(n + 1)]",
    "    for i in range(1, n + 1):",
    "        wt, val = items[i - 1]",
    "        for w in range(1, W + 1):",
    "            dp[i][w] = dp[i - 1][w]",
    "            if w >= wt:",
    "                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + val)",
    "    return dp[n][W]",
]

# 스텝으로 올리지 않는 줄(n 구하기, 바깥·안쪽 반복 머리, if 조건)
SKIP_LINES = {2, 4, 6, 8}

MAIN = [(2, 3), (3, 4), (4, 5)]

CASES = [
    {"name": "① 과 같은 입력 — 물건 3개·용량 5", "items": MAIN, "W": 5},
    {"name": "용량 6", "items": MAIN, "W": 6},
    {"name": "그리디 반례", "items": [(3, 5), (2, 3), (2, 3)], "W": 4},
    {"name": "물건 하나가 용량보다 무겁다", "items": [(6, 9)], "W": 5},
    {"name": "물건이 없다", "items": [], "W": 3},
    {"name": "용량 0", "items": [(1, 2), (2, 3)], "W": 0},
]


def knapsack(items, W):
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wt, val = items[i - 1]
        for w in range(1, W + 1):
            dp[i][w] = dp[i - 1][w]
            if w >= wt:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + val)
    return dp[n][W]


FIRST_LINE = knapsack.__code__.co_firstlineno


def snapshot(frame):
    loc = frame.f_locals
    dp = loc.get("dp")
    return [loc.get("i"), loc.get("w"), loc.get("wt"), [list(r) for r in dp] if dp is not None else None]


def trace_case(items, W):
    """[[line, i, w, wt, dp], …] — 줄을 실행한 뒤의 상태. 아직 없는 변수는 None."""
    events = []  # (line, 실행 전 상태)
    final = []

    def tracer(frame, event, _arg):
        if frame.f_code.co_name != "knapsack":
            return None
        if event == "line":
            line = frame.f_lineno - FIRST_LINE + 1
            # 3.12 이상은 리스트 컴프리헨션이 줄 안에서 돌며 같은 줄 이벤트를 되풀이한다 — 하나로 합친다
            if events and events[-1][0] == 3 and line == 3:
                return tracer
            events.append((line, snapshot(frame)))
        elif event == "return":
            final.append(snapshot(frame))
        return tracer

    sys.settrace(tracer)
    try:
        knapsack(list(items), W)
    finally:
        sys.settrace(None)

    rows = []
    for k, (line, _before) in enumerate(events):
        after = events[k + 1][1] if k + 1 < len(events) else final[0]
        if line == 1 or line in SKIP_LINES:
            continue  # 첫 줄(def)은 JS 테이프에 없다
        rows.append([line, *after])
    return rows


# ── ⑥ 틀리는 자리에 적은 값을 실제 Python 으로 확인 ──


def table(items, W):
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wt, val = items[i - 1]
        for w in range(1, W + 1):
            dp[i][w] = dp[i - 1][w]
            if w >= wt:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + val)
    return dp


def no_check(items, W):
    """`if w >= wt` 를 빼면 dp[i-1][w-wt] 가 음수 인덱스가 되어 표의 끝 칸을 조용히 읽는다."""
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wt, val = items[i - 1]
        for w in range(1, W + 1):
            dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - wt] + val)
    return dp[n][W]


def one_dim(items, W, backward):
    dp = [0] * (W + 1)
    for wt, val in items:
        rng = range(W, wt - 1, -1) if backward else range(wt, W + 1)
        for w in rng:
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp


def greedy(items, W):
    total = value = 0
    for wt, val in sorted(items, key=lambda x: -x[1] / x[0]):
        if total + wt <= W:
            total += wt
            value += val
    return value


def facts():
    counter = [(3, 5), (2, 3), (2, 3)]
    return {
        "nocheck": no_check(MAIN, 5),
        "forward": one_dim(MAIN, 5, False),
        "backward": one_dim(MAIN, 5, True),
        "greedy_counter": {"items": counter, "W": 4, "greedy": greedy(counter, 4), "best": table(counter, 4)[3][4]},
        "w6": table(MAIN, 6)[3][6],
    }


def main():
    cases = [{**c, "trace": trace_case(c["items"], c["W"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases, "facts": facts()}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
