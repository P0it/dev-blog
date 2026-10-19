"""물건 담기 완전탐색을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/brute-force.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_brute_force.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "brute-force.json"

# src/lib/algo/brute-force.ts 의 PACK_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def best_pack(weights, values, limit):",
    "    n = len(weights)",
    "    best = 0",
    "    for mask in range(2 ** n):",
    "        w = v = 0",
    "        for i in range(n):",
    "            if mask >> i & 1:",
    "                w += weights[i]",
    "                v += values[i]",
    "        if w <= limit and v > best:",
    "            best = v",
    "    return best",
]

CASES = [
    {"name": "물건 3개", "weights": [2, 3, 4], "values": [3, 4, 5], "limit": 5},
    {"name": "물건 없음", "weights": [], "values": [], "limit": 5},
    {"name": "물건 1개 — 못 담음", "weights": [9], "values": [4], "limit": 5},
    {"name": "물건 2개 — 다 담김", "weights": [1, 2], "values": [3, 4], "limit": 10},
]


def best_pack(weights, values, limit):
    n = len(weights)
    best = 0
    for mask in range(2 ** n):
        w = v = 0
        for i in range(n):
            if mask >> i & 1:
                w += weights[i]
                v += values[i]
        if w <= limit and v > best:
            best = v
    return best


FIRST_LINE = best_pack.__code__.co_firstlineno


def trace_case(weights, values, limit):
    """[[line, mask, i, w, v, best], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "best_pack":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("mask"),
                loc.get("i"),
                loc.get("w"),
                loc.get("v"),
                loc.get("best"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        best_pack(weights, values, limit)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["weights"], c["values"], c["limit"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
