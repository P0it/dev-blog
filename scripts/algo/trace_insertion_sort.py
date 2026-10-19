"""삽입 정렬을 실제 Python 으로 돌려 줄 번호·변수·배열 시퀀스를 뽑는다.

JS 구현(src/lib/algo/insertion-sort.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_insertion_sort.py

선택 정렬 fixture 와 같은 방식으로 행마다 **그 줄을 실행한 뒤**의 상태를 담는다(다음 line 이벤트나 return
이벤트의 지역 변수). `j -= 1`(7번)은 JS 테이프에 스텝으로 올리지 않으므로 뺀다 — 그 줄이 하는 일(j 감소)은
바로 뒤 5번 줄의 상태에 들어 있다. 이렇게 빼면 한 번 밀 때마다 스텝이 둘씩 늘어 연타로 끝나는 플레이어가
되는 걸 막는다. 아직 없는 변수는 None, 바깥 반복이 도는 동안 key·j 는 직전 값이 남는다.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "insertion-sort.json"

# src/lib/algo/insertion-sort.ts 의 INSERTION_SORT_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def insertion_sort(arr):",
    "    for i in range(1, len(arr)):",
    "        key = arr[i]",
    "        j = i - 1",
    "        while j >= 0 and arr[j] > key:",
    "            arr[j + 1] = arr[j]",
    "            j -= 1",
    "        arr[j + 1] = key",
    "    return arr",
]

# 스텝으로 올리지 않는 줄(j 를 한 칸 줄이는 줄)
SKIP_LINES = {7}

CASES = [
    {"name": "손으로 해 본 카드", "arr": [5, 2, 9, 1, 7, 4]},
    {"name": "이미 정렬됨", "arr": [1, 2, 4, 5, 7, 9]},
    {"name": "거의 정렬됨", "arr": [1, 2, 4, 7, 5, 9]},
    {"name": "거꾸로", "arr": [6, 5, 4, 3, 2, 1]},
    {"name": "같은 값", "arr": [2, 2, 1]},
    {"name": "빈 배열", "arr": []},
    {"name": "길이 1", "arr": [7]},
    {"name": "길이 2", "arr": [3, 1]},
]


def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr


FIRST_LINE = insertion_sort.__code__.co_firstlineno


def snapshot(frame):
    loc = frame.f_locals
    return [loc.get("i"), loc.get("key"), loc.get("j"), list(loc["arr"])]


def trace_case(arr):
    """[[line, i, key, j, arr], …] — 줄을 실행한 뒤의 상태. 아직 없는 변수는 None."""
    events = []  # (line, 실행 전 상태)
    final = []

    def tracer(frame, event, _arg):
        if frame.f_code.co_name != "insertion_sort":
            return None
        if event == "line":
            events.append((frame.f_lineno - FIRST_LINE + 1, snapshot(frame)))
        elif event == "return":
            final.append(snapshot(frame))
        return tracer

    sys.settrace(tracer)
    try:
        insertion_sort(list(arr))
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
    cases = [{**c, "trace": trace_case(c["arr"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
