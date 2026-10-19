"""퀵 정렬을 실제 Python 으로 돌려 줄 번호·변수·배열 시퀀스를 뽑는다.

JS 구현(src/lib/algo/quick-sort.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_quick_sort.py

재귀 함수라 호출마다 프레임이 따로 있다. 화면 테이프는 스텝이 수백 개로 늘지 않게 이렇게 묶는다.

- **첫 호출(루트)** 은 줄마다 한 행씩 낸다. 행은 **그 줄을 실행한 뒤**의 상태다(같은 프레임의 다음 줄 이벤트가
  오기 직전의 지역 변수). `for j` 머리(6번)와 `def`(1번)는 뺀다.
- 루트의 **11·12번 줄**(재귀 호출)은 호출 **직전** 상태를 낸다. 호출이 끝난 뒤의 상태를 쓰면 왼쪽을 다 정렬한
  배열이 호출 줄에 찍혀 뒤의 스텝들과 시간이 어긋난다.
- **더 깊은 호출** 은 10번 줄(기준 카드를 제 자리에 놓은 직후) 한 행만 낸다. 그 호출이 안에서 하는 비교·교환은
  화면에 올리지 않는다. 한 칸짜리·빈 호출은 아무 행도 안 낸다.

행 = [줄, lo, hi, pivot, i, j, 배열]. 아직 값이 없는 변수는 None.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "quick-sort.json"

# src/lib/algo/quick-sort.ts 의 QUICK_SORT_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def quick_sort(arr, lo, hi):",
    "    if lo >= hi:",
    "        return",
    "    pivot = arr[lo]",
    "    i = lo",
    "    for j in range(lo + 1, hi + 1):",
    "        if arr[j] < pivot:",
    "            i += 1",
    "            arr[i], arr[j] = arr[j], arr[i]",
    "    arr[lo], arr[i] = arr[i], arr[lo]",
    "    quick_sort(arr, lo, i - 1)",
    "    quick_sort(arr, i + 1, hi)",
]

CASES = [
    {"name": "손으로 해 본 카드", "arr": [6, 3, 8, 2, 9, 1, 5]},
    {"name": "이미 정렬됨", "arr": [1, 2, 3, 4, 5, 6, 7]},
    {"name": "거꾸로", "arr": [7, 6, 5, 4, 3, 2, 1]},
    {"name": "같은 값", "arr": [2, 2, 1]},
    {"name": "모두 같은 값", "arr": [4, 4, 4, 4]},
    {"name": "빈 배열", "arr": []},
    {"name": "길이 1", "arr": [7]},
    {"name": "길이 2", "arr": [3, 1]},
    {"name": "다섯 장", "arr": [5, 1, 4, 2, 3]},
]

SKIP_LINES = {1, 6}


def quick_sort(arr, lo, hi):
    if lo >= hi:
        return
    pivot = arr[lo]
    i = lo
    for j in range(lo + 1, hi + 1):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[lo], arr[i] = arr[i], arr[lo]
    quick_sort(arr, lo, i - 1)
    quick_sort(arr, i + 1, hi)


FIRST_LINE = quick_sort.__code__.co_firstlineno


def snapshot(frame):
    loc = frame.f_locals
    return [
        loc.get("lo"),
        loc.get("hi"),
        loc.get("pivot"),
        loc.get("i"),
        loc.get("j"),
        list(loc["arr"]),
    ]


def trace_case(arr):
    rows = []
    pending = {}  # 프레임 → (줄, 깊이) — 다음 이벤트가 와야 "실행한 뒤" 상태를 안다
    depth = [0]
    depth_of = {}

    def emit_pending(frame, after):
        item = pending.pop(frame, None)
        if item is None:
            return
        line, d = item
        if d == 1:
            if line in (2, 3, 4, 5, 7, 8, 9, 10):
                rows.append([line, *after])
        elif line == 10:
            rows.append([line, *after])

    def tracer(frame, event, _arg):
        if frame.f_code.co_name != "quick_sort":
            return None
        if event == "call":
            depth[0] += 1
            depth_of[frame] = depth[0]
        elif event == "line":
            line = frame.f_lineno - FIRST_LINE + 1
            snap = snapshot(frame)
            emit_pending(frame, snap)
            d = depth_of[frame]
            if line in (11, 12):
                if d == 1:
                    rows.append([line, *snap])
            elif line not in SKIP_LINES:
                pending[frame] = (line, d)
        elif event == "return":
            emit_pending(frame, snapshot(frame))
            depth[0] -= 1
            depth_of.pop(frame, None)
        return tracer

    sys.settrace(tracer)
    try:
        quick_sort(list(arr), 0, len(arr) - 1)
    finally:
        sys.settrace(None)
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
