"""리스트 맨 앞 삽입(insert_front)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/array-list.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_array_list.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "array-list.json"

# src/lib/algo/array-list.ts 의 ARRAY_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def insert_front(arr, x):",
    "    arr.append(None)",
    "    moved = 0",
    "    for i in range(len(arr) - 1, 0, -1):",
    "        arr[i] = arr[i - 1]",
    "        moved += 1",
    "    arr[0] = x",
    "    return moved",
]

CASES = [
    {"name": "7명 줄에 새 사람", "arr": [3, 5, 8, 2, 9, 4, 7], "x": 1},
    {"name": "한 명", "arr": [5], "x": 1},
    {"name": "빈 줄", "arr": [], "x": 1},
    {"name": "두 명", "arr": [4, 6], "x": 2},
]


def insert_front(arr, x):
    arr.append(None)
    moved = 0
    for i in range(len(arr) - 1, 0, -1):
        arr[i] = arr[i - 1]
        moved += 1
    arr[0] = x
    return moved


FIRST_LINE = insert_front.__code__.co_firstlineno


def trace_case(arr, x):
    """[[line, i, moved, arr], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None. arr 은 그 줄 실행 전 모습."""
    rows = []
    work = list(arr)

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "insert_front":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("i"),
                loc.get("moved"),
                list(loc["arr"]),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        insert_front(work, x)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["arr"], c["x"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
