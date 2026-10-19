"""거스름돈(큰 동전부터 주기)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/greedy-coins.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_greedy_coins.py

행마다 **그 줄을 실행한 뒤**의 상태를 담는다(다음 line 이벤트나 return 이벤트의 지역 변수).
`for coin in coins` 머리 줄(4번)은 JS 테이프에 스텝으로 올리지 않으므로 뺀다 — 그 줄이 하는 일(coin 배정)은
바로 뒤 5번 줄의 상태에 들어 있다. 아직 만들지 않은 `given` 은 빈 목록으로 적는다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "greedy-coins.json"

# src/lib/algo/greedy-coins.ts 의 COIN_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def greedy_coins(coins, amount):",
    "    coins = sorted(coins, reverse=True)",
    "    given = []",
    "    for coin in coins:",
    "        while amount >= coin:",
    "            amount -= coin",
    "            given.append(coin)",
    "    return given",
]

# 스텝으로 올리지 않는 줄(for 머리)
SKIP_LINES = {4}

CASES = [
    {"name": "세트 A 1260원", "coins": [10, 50, 100, 500], "amount": 1260},
    {"name": "세트 B 6원", "coins": [1, 3, 4], "amount": 6},
    {"name": "1·5·12원으로 15원", "coins": [1, 5, 12], "amount": 15},
    {"name": "거슬러 줄 수 없음", "coins": [5, 10], "amount": 12},
    {"name": "0원", "coins": [4, 3, 1], "amount": 0},
    {"name": "동전 하나", "coins": [7], "amount": 21},
]


def greedy_coins(coins, amount):
    coins = sorted(coins, reverse=True)
    given = []
    for coin in coins:
        while amount >= coin:
            amount -= coin
            given.append(coin)
    return given


FIRST_LINE = greedy_coins.__code__.co_firstlineno


def snapshot(frame):
    loc = frame.f_locals
    return [loc.get("amount"), loc.get("coin"), list(loc.get("given", []))]


def trace_case(coins, amount):
    """[[line, amount, coin, given], …] — 줄을 실행한 뒤의 상태. 아직 없는 coin 은 None."""
    events = []  # (line, 실행 전 상태)
    final = []

    def tracer(frame, event, _arg):
        if frame.f_code.co_name != "greedy_coins":
            return None
        if event == "line":
            events.append((frame.f_lineno - FIRST_LINE + 1, snapshot(frame)))
        elif event == "return":
            final.append(snapshot(frame))
        return tracer

    sys.settrace(tracer)
    try:
        greedy_coins(list(coins), amount)
    finally:
        sys.settrace(None)

    rows = []
    for k, (line, _before) in enumerate(events):
        after = events[k + 1][1] if k + 1 < len(events) else final[0]
        if line == 1 or line in SKIP_LINES:
            continue  # 첫 줄(def)은 JS 테이프에 없다
        rows.append([line, *after])
    return rows


def main():
    cases = [{**c, "trace": trace_case(c["coins"], c["amount"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
