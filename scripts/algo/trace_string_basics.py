"""회문 판별(양끝에서 안쪽으로 좁히기)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/string-basics.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_string_basics.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "string-basics.json"

# src/lib/algo/string-basics.ts 의 PAL_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def is_palindrome(s):",
    "    left, right = 0, len(s) - 1",
    "    while left < right:",
    "        if s[left] != s[right]:",
    "            return False",
    "        left += 1",
    "        right -= 1",
    "    return True",
]

CASES = [
    {"name": "기러기 — 홀수 길이 회문", "s": "기러기"},
    {"name": "토마토 — 홀수 길이 회문", "s": "토마토"},
    {"name": "아버지 — 첫 쌍부터 다름", "s": "아버지"},
    {"name": "level", "s": "level"},
    {"name": "hello — 첫 쌍부터 다름", "s": "hello"},
    {"name": "소주만병만주소 — 긴 회문", "s": "소주만병만주소"},
    {"name": "abba — 짝수 길이 회문", "s": "abba"},
    {"name": "abca — 안쪽에서 다름", "s": "abca"},
    {"name": "빈 문자열", "s": ""},
    {"name": "한 글자", "s": "a"},
]


def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True


FIRST_LINE = is_palindrome.__code__.co_firstlineno


def trace_case(s):
    """[[line, left, right], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "is_palindrome":
            return None
        if event == "line":
            loc = frame.f_locals
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("left"),
                loc.get("right"),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        is_palindrome(s)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1]


def main():
    cases = [{**c, "trace": trace_case(c["s"]), "result": is_palindrome(c["s"])} for c in CASES]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
