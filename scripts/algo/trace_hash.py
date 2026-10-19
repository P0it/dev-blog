"""작은 해시 표(사물함 8칸)를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/hash.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**
글자 번호의 합은 `sum(ord(c))` 이다 — JS 는 `charCodeAt` 로 같은 값을 낸다(영문 소문자만 쓴다).

    python scripts/algo/trace_hash.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "hash.json"

# src/lib/algo/hash.ts 의 HASH_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def build_and_find(names, target):",
    "    buckets = [[] for _ in range(8)]",
    "    for name in names:",
    "        slot = sum(ord(c) for c in name) % 8",
    "        buckets[slot].append(name)",
    "    slot = sum(ord(c) for c in target) % 8",
    "    for who in buckets[slot]:",
    "        if who == target:",
    "            return True",
    "    return False",
]

CASES = [
    {"name": "① 과 같은 여섯 이름에서 zed 찾기", "names": ["kim", "lee", "amy", "bob", "tom", "zed"], "target": "zed"},
    {"name": "충돌 없는 칸에서 찾기", "names": ["kim", "lee", "amy", "bob", "tom", "zed"], "target": "lee"},
    {"name": "표에 없는 이름", "names": ["kim", "lee", "amy"], "target": "bob"},
    {"name": "빈 목록", "names": [], "target": "kim"},
    {"name": "글자 순서만 다른 두 이름(같은 칸)", "names": ["tom", "mot"], "target": "mot"},
]


def build_and_find(names, target):
    buckets = [[] for _ in range(8)]
    for name in names:
        slot = sum(ord(c) for c in name) % 8
        buckets[slot].append(name)
    slot = sum(ord(c) for c in target) % 8
    for who in buckets[slot]:
        if who == target:
            return True
    return False


# 이 파일 안에서 build_and_find 가 시작하는 줄 → CODE 의 1번 줄(def)에 대응시킨다.
FIRST_LINE = build_and_find.__code__.co_firstlineno


def trace_case(names, target):
    """[[line, slot, filled], …] — JS 쪽 steps 와 같은 모양. filled 는 사물함에 들어 있는 이름표 수."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "build_and_find":
            return None
        if event == "line":
            local = frame.f_locals
            buckets = local.get("buckets")
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                local.get("slot"),
                None if buckets is None else sum(len(b) for b in buckets),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        build_and_find(list(names), target)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다.
    # 2번 줄의 리스트 컴프리헨션은 Python 3.12 이상에서 칸마다 줄 이벤트를 내므로(8칸 → 9번),
    # 이어진 2번 줄 이벤트는 한 스텝으로 합친다. 화면은 "빈 사물함 8칸을 만든다" 한 스텝이다.
    kept = []
    for r in rows:
        if r[0] == 1:
            continue
        if r[0] == 2 and kept and kept[-1][0] == 2:
            continue
        kept.append(r)
    return kept


def main():
    cases = []
    for c in CASES:
        cases.append({
            "name": c["name"],
            "names": c["names"],
            "target": c["target"],
            "trace": trace_case(c["names"], c["target"]),
            "found": build_and_find(list(c["names"]), c["target"]),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
