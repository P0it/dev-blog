"""힙에 값을 넣는 sift-up 을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/heap.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_heap.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "heap.json"

# src/lib/algo/heap.ts 의 HEAP_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def push(heap, x):",
    "    heap.append(x)",
    "    i = len(heap) - 1",
    "    while i > 0:",
    "        p = (i - 1) // 2",
    "        if heap[p] <= heap[i]:",
    "            break",
    "        heap[p], heap[i] = heap[i], heap[p]",
    "        i = p",
    "    return heap",
]

CASES = [
    {"name": "맨 위까지 올라감", "heap": [2, 5, 3, 9, 6, 8], "x": 1},
    {"name": "첫 비교에서 멈춤", "heap": [2, 5, 3, 9, 6, 8], "x": 4},
    {"name": "한 번 올라가고 멈춤", "heap": [2, 5, 3, 9, 6, 8], "x": 2},
    {"name": "빈 힙", "heap": [], "x": 7},
    {"name": "같은 값은 올라가지 않음", "heap": [2], "x": 2},
    {"name": "하나뿐인 힙에서 위로", "heap": [1], "x": 0},
]


def push(heap, x):
    heap.append(x)
    i = len(heap) - 1
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            break
        heap[p], heap[i] = heap[i], heap[p]
        i = p
    return heap


FIRST_LINE = push.__code__.co_firstlineno


def trace_case(heap, x):
    """[[line, i, p, heap], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "push":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("i"),
                loc.get("p"),
                list(loc["heap"]),
            ])
        return tracer

    work = list(heap)
    sys.settrace(tracer)
    try:
        result = push(work, x)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1], result


def main():
    cases = []
    for c in CASES:
        trace, result = trace_case(c["heap"], c["x"])
        cases.append({"name": c["name"], "heap": c["heap"], "x": c["x"], "trace": trace, "result": result})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
