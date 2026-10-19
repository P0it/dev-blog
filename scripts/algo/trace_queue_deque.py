"""줄 처리(deque 의 append / popleft)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/queue-deque.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_queue_deque.py
"""

import json
import sys
from collections import deque
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "queue-deque.json"

# src/lib/algo/queue-deque.ts 의 LINE_CODE 와 한 글자도 다르면 안 된다.
# 1번 줄은 import 라 함수 밖이다 — 함수 안 줄은 3번부터 켜진다.
CODE = [
    "from collections import deque",
    "def serve_line(line, events):",
    "    q = deque(line)",
    "    served = []",
    "    for e in events:",
    "        if e == 0:",
    "            served.append(q.popleft())",
    "        else:",
    "            q.append(e)",
    "    return served",
]

CASES = [
    {"name": "① 과 같은 8명·여섯 가지 일", "line": [1, 2, 3, 4, 5, 6, 7, 8], "events": [0, 9, 0, 0, 10, 0]},
    {"name": "도착만", "line": [1, 2], "events": [3, 4]},
    {"name": "받기만", "line": [1, 2, 3], "events": [0, 0]},
    {"name": "일이 없음", "line": [1, 2], "events": []},
    {"name": "빈 줄에 도착 뒤 받기", "line": [], "events": [5, 0]},
]


def serve_line(line, events):
    q = deque(line)
    served = []
    for e in events:
        if e == 0:
            served.append(q.popleft())
        else:
            q.append(e)
    return served


# 이 파일 안에서 serve_line 이 시작하는 줄 → CODE 의 2번 줄(def)에 대응시킨다.
FIRST_LINE = serve_line.__code__.co_firstlineno


def trace_case(line, events):
    """[[line, e, len(q), len(served)], …] — JS 쪽 steps 와 같은 모양."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "serve_line":
            return None
        if event == "line":
            local = frame.f_locals
            q = local.get("q")
            served = local.get("served")
            rows.append([
                frame.f_lineno - FIRST_LINE + 2,
                local.get("e"),
                None if q is None else len(q),
                None if served is None else len(served),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        serve_line(list(line), list(events))
    finally:
        sys.settrace(None)

    return rows


def main():
    cases = []
    for c in CASES:
        cases.append({
            "name": c["name"],
            "line": c["line"],
            "events": c["events"],
            "trace": trace_case(c["line"], c["events"]),
            "served": serve_line(list(c["line"]), list(c["events"])),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
