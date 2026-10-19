"""최대공약수(유클리드 호제법)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/gcd.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_gcd.py

행마다 **그 줄을 실행한 뒤**의 상태를 담는다(다음 line 이벤트나 return 이벤트의 지역 변수).
a·b 는 함수 인자라 처음부터 있다. 첫 줄(def)은 JS 테이프에 없다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "gcd.json"

# src/lib/algo/gcd.ts 의 GCD_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def gcd(a, b):",
    "    while b:",
    "        a, b = b, a % b",
    "    return a",
]

CASES = [
    {"name": "48 과 18", "a": 48, "b": 18},
    {"name": "서로소 17 과 5", "a": 17, "b": 5},
    {"name": "작은 수가 앞 18 과 48", "a": 18, "b": 48},
    {"name": "84 와 36", "a": 84, "b": 36},
    {"name": "작은 수가 큰 수를 나눔 36 과 72", "a": 36, "b": 72},
    {"name": "b 가 0 인 12 와 0", "a": 12, "b": 0},
    {"name": "둘 다 0", "a": 0, "b": 0},
    {"name": "10억 근처 최악 쌍", "a": 1134903170, "b": 701408733},
]


def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


FIRST_LINE = gcd.__code__.co_firstlineno


def snapshot(frame):
    loc = frame.f_locals
    return [loc.get("a"), loc.get("b")]


def trace_case(a, b):
    """[[line, a, b], …] — 줄을 실행한 뒤의 상태."""
    events = []  # (line, 실행 전 상태)
    final = []

    def tracer(frame, event, _arg):
        if frame.f_code.co_name != "gcd":
            return None
        if event == "line":
            events.append((frame.f_lineno - FIRST_LINE + 1, snapshot(frame)))
        elif event == "return":
            final.append(snapshot(frame))
        return tracer

    sys.settrace(tracer)
    try:
        gcd(a, b)
    finally:
        sys.settrace(None)

    rows = []
    for k, (line, _before) in enumerate(events):
        after = events[k + 1][1] if k + 1 < len(events) else final[0]
        if line == 1:
            continue  # 첫 줄(def)은 JS 테이프에 없다
        rows.append([line, *after])
    return rows


def main():
    cases = [{**c, "trace": trace_case(c["a"], c["b"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
