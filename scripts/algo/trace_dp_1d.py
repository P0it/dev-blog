"""1차원 DP(계단 오르기)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/dp-1d.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_dp_1d.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "dp-1d.json"

# src/lib/algo/dp-1d.ts 의 CLIMB_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def climb(n):",
    "    dp = [0] * (n + 1)",
    "    dp[0] = dp[1] = 1",
    "    for i in range(2, n + 1):",
    "        dp[i] = dp[i - 1] + dp[i - 2]",
    "    return dp[n]",
]

CASES = [
    {"name": "6칸 — ① 과 같은 입력", "n": 6},
    {"name": "1칸", "n": 1},
    {"name": "2칸", "n": 2},
    {"name": "3칸", "n": 3},
    {"name": "10칸", "n": 10},
]


def climb(n):
    dp = [0] * (n + 1)
    dp[0] = dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]


FIRST_LINE = climb.__code__.co_firstlineno


def trace_case(n):
    """[[line, i, dp 복사본], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "climb":
            return None
        if event == "line":
            loc = frame.f_locals
            dp = loc.get("dp")
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("i"),
                list(dp) if dp is not None else None,
            ])
        return tracer

    sys.settrace(tracer)
    try:
        climb(n)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["n"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
