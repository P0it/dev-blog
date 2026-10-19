"""순열 만들기(백트래킹)를 실제 Python 으로 돌려 줄 번호·상태 시퀀스를 뽑는다.

JS 구현(src/lib/algo/permutations.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_permutations.py

재귀라서 줄 이벤트가 많다(친구 셋이면 150 줄 안팎). 플레이어는 그중 4·10·12 번 줄만 올린다 —
fixture 는 모든 줄 이벤트를 담고, 어느 줄을 올릴지는 테스트가 정한다.
"""

import itertools
import json
import sys
import time
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "permutations.json"

# src/lib/algo/permutations.ts 의 PERM_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def permute(items, path, used, result):",
    "    if len(path) == len(items):",
    "        result.append(path[:])",
    "        return",
    "    for i in range(len(items)):",
    "        if used[i]:",
    "            continue",
    "        used[i] = True",
    "        path.append(items[i])",
    "        permute(items, path, used, result)",
    "        path.pop()",
    "        used[i] = False",
]

CASES = [
    {"name": "A B C", "items": ["A", "B", "C"]},
    {"name": "두 명", "items": ["A", "B"]},
    {"name": "한 명", "items": ["A"]},
    {"name": "아무도 없음", "items": []},
    {"name": "같은 값이 섞임", "items": ["A", "A", "B"]},
]


def permute(items, path, used, result):
    if len(path) == len(items):
        result.append(path[:])
        return
    for i in range(len(items)):
        if used[i]:
            continue
        used[i] = True
        path.append(items[i])
        permute(items, path, used, result)
        path.pop()
        used[i] = False


FIRST_LINE = permute.__code__.co_firstlineno


def trace_case(items):
    """[[line, i, path, used, len(result)], …] — line 이벤트는 줄을 실행하기 **전**에 찍힌다.

    i 는 그 줄이 있는 호출의 반복 변수(아직 없으면 None), path 는 지금 줄 선 친구들을 이은 글자,
    used 는 친구마다 0/1 을 이은 글자다.
    """
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "permute":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("i"),
                "".join(loc["path"]),
                "".join("1" if u else "0" for u in loc["used"]),
                len(loc["result"]),
            ])
        return tracer

    result = []
    sys.settrace(tracer)
    try:
        permute(items, [], [False] * len(items), result)
    finally:
        sys.settrace(None)
    return rows


# ── ⑥ 틀리는 자리에 적은 값들 — 페이지 숫자의 근거 ──


def permute_nocopy(items, path, used, result):
    if len(path) == len(items):
        result.append(path)  # 복사하지 않는다
        return
    for i in range(len(items)):
        if used[i]:
            continue
        used[i] = True
        path.append(items[i])
        permute_nocopy(items, path, used, result)
        path.pop()
        used[i] = False


def permute_nounchoose(items, path, used, result):
    if len(path) == len(items):
        result.append(path[:])
        return
    for i in range(len(items)):
        if used[i]:
            continue
        used[i] = True
        path.append(items[i])
        permute_nounchoose(items, path, used, result)  # 되돌리는 두 줄이 없다


def facts():
    r1 = []
    permute_nocopy(list("ABC"), [], [False] * 3, r1)
    r2 = []
    permute_nounchoose(list("ABC"), [], [False] * 3, r2)
    dup = []
    permute([1, 1, 2], [], [False] * 3, dup)
    tuples = list(itertools.permutations("ABC"))
    two = list(itertools.permutations("ABC", 2))
    combos = list(itertools.combinations("ABC", 2))

    t = time.perf_counter()
    c10 = sum(1 for _ in itertools.permutations(range(10)))
    t10 = time.perf_counter() - t

    c8 = []
    t = time.perf_counter()
    permute(list(range(8)), [], [False] * 8, c8)
    own8 = time.perf_counter() - t
    return {
        "python": sys.version.split()[0],
        "noCopy": r1,
        "noUnchoose": r2,
        "dup": dup,
        "dupUnique": len({tuple(x) for x in dup}),
        "itertoolsPerm": [list(x) for x in tuples],
        "itertoolsPerm2": [list(x) for x in two],
        "itertoolsComb2": [list(x) for x in combos],
        "perm10": c10,
        "perm10Seconds": round(t10, 2),
        "own8Count": len(c8),
        "own8Seconds": round(own8, 3),
    }


def main():
    cases = [{"name": c["name"], "items": c["items"], "trace": trace_case(c["items"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "facts": facts(), "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
