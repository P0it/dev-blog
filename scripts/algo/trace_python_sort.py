"""key 값을 만들어 줄 세우는 코드(sorted 의 key= 가 안에서 하는 일을 풀어 쓴 것)를 실제 Python 으로 돌려
줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/python-sort.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_python_sort.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "python-sort.json"

# src/lib/algo/python-sort.ts 의 KEY_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def by_key(cards):",
    "    keyed = []",
    "    for name, score in cards:",
    "        key = (-score, name)",
    "        keyed.append((key, name, score))",
    "    keyed.sort()",
    "    return [(n, s) for k, n, s in keyed]",
]

CASES = [
    {"name": "① 과 같은 여섯 장", "cards": [["kim", 80], ["lee", 90], ["amy", 80], ["bob", 70], ["tom", 90], ["zed", 80]]},
    {"name": "같은 점수 두 장", "cards": [["kim", 80], ["amy", 80]]},
    {"name": "한 장", "cards": [["kim", 80]]},
    {"name": "빈 목록", "cards": []},
    {"name": "전부 같은 점수", "cards": [["c", 5], ["a", 5], ["b", 5]]},
]


def by_key(cards):
    keyed = []
    for name, score in cards:
        key = (-score, name)
        keyed.append((key, name, score))
    keyed.sort()
    return [(n, s) for k, n, s in keyed]


# 이 파일 안에서 by_key 가 시작하는 줄 → CODE 의 1번 줄(def)에 대응시킨다.
FIRST_LINE = by_key.__code__.co_firstlineno


def trace_case(cards):
    """[[line, score, len(keyed)], …] — JS 쪽 steps 와 같은 모양."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "by_key":
            return None
        if event == "line":
            local = frame.f_locals
            keyed = local.get("keyed")
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                local.get("score"),
                None if keyed is None else len(keyed),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        by_key([tuple(c) for c in cards])
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다. 7번 줄의 리스트 컴프리헨션은 Python 3.12 이상에서
    # 원소마다 줄 이벤트를 내므로(여섯 장 → 여러 번), 이어진 7번 줄 이벤트는 한 스텝으로 합친다.
    kept = []
    for r in rows:
        if r[0] == 1:
            continue
        if r[0] == 7 and kept and kept[-1][0] == 7:
            continue
        kept.append(r)
    return kept


def main():
    cases = []
    for c in CASES:
        cases.append({
            "name": c["name"],
            "cards": c["cards"],
            "trace": trace_case(c["cards"]),
            "order": [n for n, _ in by_key([tuple(x) for x in c["cards"]])],
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
