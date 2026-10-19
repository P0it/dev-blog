"""스택(괄호 검사)을 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/stack.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_stack.py
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "stack.json"

# src/lib/algo/stack.ts 의 BRACKET_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def is_balanced(s):",
    '    pairs = {")": "(", "]": "[", "}": "{"}',
    "    stack = []",
    "    for c in s:",
    '        if c in "([{":',
    "            stack.append(c)",
    "        elif c in pairs:",
    "            if not stack or stack[-1] != pairs[c]:",
    "                return False",
    "            stack.pop()",
    "    return not stack",
]

CASES = [
    {"name": "짝이 맞음", "s": "([{}])"},
    {"name": "안쪽 짝이 어긋남", "s": "([{)]}"},
    {"name": "닫는 괄호로 시작", "s": ")("},
    {"name": "끝났는데 스택이 남음", "s": "(()"},
    {"name": "종류가 다름", "s": "(]"},
    {"name": "빈 문자열", "s": ""},
    {"name": "괄호 아닌 글자는 건너뜀", "s": "a(b)c"},
]


def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in "([{":
            stack.append(c)
        elif c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
    return not stack


FIRST_LINE = is_balanced.__code__.co_firstlineno


def trace_case(s):
    """[[line, c, stack], …] — JS 쪽 steps 와 같은 모양. 아직 없는 변수는 None, stack 은 글자를 이어 붙인 문자열."""
    rows = []

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "is_balanced":
            return None
        if event == "line":
            loc = frame.f_locals
            stack = loc.get("stack")
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("c"),
                None if stack is None else "".join(stack),
            ])
        return tracer

    sys.settrace(tracer)
    try:
        result = is_balanced(s)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다 — JS 는 2번 줄부터 스텝을 낸다
    return [r for r in rows if r[0] != 1], result


def main():
    cases = []
    for c in CASES:
        trace, result = trace_case(c["s"])
        cases.append({"name": c["name"], "s": c["s"], "trace": trace, "result": result})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
