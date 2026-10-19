"""회의실 배정(끝나는 시간이 빠른 회의부터)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/activity-selection.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
코드를 바꿔 돌려 본 값(시작 순·`>`·정렬 안 함·끝이 같을 때)도 같이 뽑아 `variants` 에 둔다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_activity_selection.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "activity-selection.json"

# src/lib/algo/activity-selection.ts 의 MEET_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def max_meetings(meetings):",
    "    meetings.sort(key=lambda m: (m[1], m[0]))",
    "    count = 0",
    "    end = 0",
    "    for s, e in meetings:",
    "        if s >= end:",
    "            count += 1",
    "            end = e",
    "    return count",
]

CASES = [
    {"name": "① 의 회의 여섯 개", "meetings": [[9, 16], [10, 11], [11, 15], [12, 17], [13, 16], [15, 20]]},
    {"name": "빈 목록", "meetings": []},
    {"name": "회의 하나", "meetings": [[9, 10]]},
    {"name": "끝과 시작이 맞닿음", "meetings": [[1, 2], [2, 3], [3, 4]]},
    {"name": "전부 겹침", "meetings": [[1, 5], [2, 6], [3, 7]]},
    {"name": "끝나는 시간이 같음", "meetings": [[1, 3], [2, 3], [3, 4], [3, 5]]},
    {"name": "섞인 순서", "meetings": [[5, 9], [1, 4], [8, 12], [3, 6], [6, 8]]},
]


def max_meetings(meetings):
    meetings.sort(key=lambda m: (m[1], m[0]))
    count = 0
    end = 0
    for s, e in meetings:
        if s >= end:
            count += 1
            end = e
    return count


FIRST_LINE = max_meetings.__code__.co_firstlineno


def trace_case(meetings):
    """[[line, s, e, count, end], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "max_meetings":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("s"),
                loc.get("e"),
                loc.get("count"),
                loc.get("end"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        result = max_meetings([list(m) for m in meetings])
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1], result


# ── 코드를 바꿔 돌려 본 값 ──
def run(meetings, key, strict):
    """key: 'end'(기본) · 'start' · 'duration' · 'end_only'(끝이 같을 때 시작 순 없음) · 'none'(정렬 안 함)."""
    ms = [list(m) for m in meetings]
    if key == "end":
        ms.sort(key=lambda m: (m[1], m[0]))
    elif key == "start":
        ms.sort(key=lambda m: (m[0], m[1]))
    elif key == "duration":
        ms.sort(key=lambda m: (m[1] - m[0], m[0]))
    elif key == "end_only":
        ms.sort(key=lambda m: m[1])
    count = 0
    end = 0
    for s, e in ms:
        ok = s > end if strict else s >= end
        if ok:
            count += 1
            end = e
    return count


MAIN = CASES[0]["meetings"]
VARIANTS = [
    {"name": "기본", "meetings": MAIN, "key": "end", "strict": False},
    {"name": "시작 순으로 정렬", "meetings": MAIN, "key": "start", "strict": False},
    {"name": "정렬 안 함", "meetings": MAIN, "key": "none", "strict": False},
    {"name": "s > end", "meetings": [[1, 2], [2, 3]], "key": "end", "strict": True},
    {"name": "s >= end", "meetings": [[1, 2], [2, 3]], "key": "end", "strict": False},
    {"name": "0분 회의 — 끝만으로 정렬", "meetings": [[3, 3], [1, 3]], "key": "end_only", "strict": False},
    {"name": "0분 회의 — 끝, 시작 순으로 정렬", "meetings": [[3, 3], [1, 3]], "key": "end", "strict": False},
]


def main():
    cases = []
    for c in CASES:
        trace, result = trace_case(c["meetings"])
        cases.append({**c, "trace": trace, "result": result})
    variants = [{**v, "result": run(v["meetings"], v["key"], v["strict"])} for v in VARIANTS]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases, "variants": variants}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases, {len(variants)} variants")
    for v in variants:
        print(f'  {v["name"]}: {v["result"]}')


if __name__ == "__main__":
    main()
