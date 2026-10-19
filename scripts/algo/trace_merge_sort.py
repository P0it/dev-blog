"""병합 정렬을 실제 Python 으로 돌려 줄 번호·변수·`result` 시퀀스를 뽑는다.

JS 구현(src/lib/algo/merge-sort.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_merge_sort.py

재귀라서 한 함수의 줄이 다른 호출의 줄과 뒤섞인다. 그래서 행마다 **호출(프레임)별로 그 줄을 실행한 뒤**의 상태를
담는다 — 같은 프레임의 다음 line 이벤트나 return 이벤트가 오면 그 순간의 지역 변수가 그 줄의 "실행 뒤" 상태다.
행은 줄이 시작된 시간 순서로 쌓는다. 화면에 올리지 않는 줄(SHOWN 에 없는 줄)은 행으로 만들지 않는다.

행 = [줄, 함수, a, b, c]
  - merge_sort: [줄, "merge_sort", len(arr), mid, None]
  - merge:      [줄, "merge", i, j, result]   (아직 없는 변수는 None)
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "merge-sort.json"

# src/lib/algo/merge-sort.ts 의 MERGE_SORT_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def merge_sort(arr):",
    "    if len(arr) <= 1:",
    "        return arr",
    "    mid = len(arr) // 2",
    "    left = merge_sort(arr[:mid])",
    "    right = merge_sort(arr[mid:])",
    "    return merge(left, right)",
    "",
    "def merge(left, right):",
    "    result = []",
    "    i = j = 0",
    "    while i < len(left) and j < len(right):",
    "        if left[i] <= right[j]:",
    "            result.append(left[i])",
    "            i += 1",
    "        else:",
    "            result.append(right[j])",
    "            j += 1",
    "    result += left[i:] + right[j:]",
    "    return result",
]

# 화면(스텝)에 올리는 줄. 나머지는 바로 앞뒤 줄의 상태에 이미 들어 있어 스텝이 늘기만 한다.
SHOWN = {4, 7, 13, 14, 17, 19, 20}

CASES = [
    {"name": "손으로 해 본 카드(6장)", "arr": [5, 2, 9, 1, 7, 4]},
    {"name": "홀수 길이(5장)", "arr": [3, 1, 2, 5, 4]},
    {"name": "이미 정렬됨", "arr": [1, 2, 3, 4]},
    {"name": "거꾸로", "arr": [4, 3, 2, 1]},
    {"name": "같은 값", "arr": [2, 1, 2]},
    {"name": "길이 2", "arr": [3, 1]},
    {"name": "길이 1", "arr": [7]},
    {"name": "빈 배열", "arr": []},
]


# 아래 두 함수의 줄 배치(함수 사이 빈 줄 하나)가 CODE 와 같아야 줄 번호가 맞는다.
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result += left[i:] + right[j:]
    return result


FIRST_LINE = merge_sort.__code__.co_firstlineno
NAMES = ("merge_sort", "merge")


def snapshot(frame):
    loc = frame.f_locals
    if frame.f_code.co_name == "merge_sort":
        return ["merge_sort", len(loc["arr"]), loc.get("mid"), None]
    result = list(loc["result"]) if "result" in loc else None
    return ["merge", loc.get("i"), loc.get("j"), result]


def trace_case(arr):
    rows = []  # [줄, 함수, a, b, c] — 줄 뒤쪽은 나중에 채운다
    pending = {}  # 프레임 id → 실행 뒤 상태를 기다리는 행 번호

    def finish(frame):
        k = pending.pop(id(frame), None)
        if k is not None:
            rows[k][1:] = snapshot(frame)

    def tracer(frame, event, _arg):
        if frame.f_code.co_name not in NAMES:
            return None
        if event == "line":
            finish(frame)  # 이 프레임의 앞 줄이 실행된 뒤의 상태
            line = frame.f_lineno - FIRST_LINE + 1
            if line in SHOWN:
                rows.append([line, None, None, None, None])
                pending[id(frame)] = len(rows) - 1
        elif event == "return":
            finish(frame)
        return tracer

    sys.settrace(tracer)
    try:
        merge_sort(list(arr))
    finally:
        sys.settrace(None)
    return rows


def main():
    cases = [{**c, "trace": trace_case(c["arr"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "shown": sorted(SHOWN), "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
