"""에라토스테네스의 체 코드를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/sieve.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_sieve.py

화면에 보이는 코드(CODE)를 한 줄도 고치지 않고 exec 해서 돌린다. 행은 `[줄, i, j, 지운 수]` 이고
**그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 None). `지운 수` 는 `is_prime[2:]` 안의 False 개수다.

올리는 줄은 JS 테이프와 같다 — 2·3·5·6·7·8. 4번 줄(`for i`)은 올리지 않고, 안쪽 반복(6·7번 줄이 칸마다 되풀이된다)은
소수 i 하나당 두 스텝으로 묶는다: 6번 줄 한 스텝(처음 j 를 잡은 직후)과 7번 줄 한 스텝(안쪽 반복이 모두 끝난 직후).
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "sieve.json"

# src/lib/algo/sieve.ts 의 SIEVE_CODE 와 한 글자도 다르면 안 된다.
CODE = [
    "def sieve(n):",
    "    is_prime = [True] * (n + 1)",
    "    is_prime[0] = is_prime[1] = False",
    "    for i in range(2, int(n ** 0.5) + 1):",
    "        if is_prime[i]:",
    "            for j in range(i * i, n + 1, i):",
    "                is_prime[j] = False",
    "    return [k for k in range(n + 1) if is_prime[k]]",
]

CASES = [
    {"name": "데모 입력 60", "n": 60},
    {"name": "30", "n": 30},
    {"name": "10", "n": 10},
    {"name": "4 — 안쪽 반복이 한 번뿐", "n": 4},
    {"name": "49 — 7×7 이 끝 칸", "n": 49},
    {"name": "100", "n": 100},
    {"name": "3 — 바깥 반복이 없다", "n": 3},
    {"name": "2", "n": 2},
    {"name": "1", "n": 1},
]


def make_fn():
    ns = {}
    exec(compile("\n".join(CODE), "<code>", "exec"), ns)  # 화면에 보이는 코드 그대로 실행
    return ns["sieve"]


def trace_case(fn, n):
    rows = []
    st = {"pending": None, "group": None, "last": None, "seen8": False}

    def snap(loc):
        ip = loc.get("is_prime")
        erased = None if ip is None else sum(1 for x in ip[2:] if not x)
        return [loc.get("i"), loc.get("j"), erased]

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "sieve":
            return None
        if event not in ("line", "return"):
            return tracer
        cur = snap(frame.f_locals)
        line = frame.f_lineno if event == "line" else None

        # 직전에 올리기로 한 줄이 실행을 마친 뒤의 변수를 이제야 읽을 수 있다
        if st["pending"] is not None:
            rows[st["pending"]][1:] = cur
            st["pending"] = None

        # 안쪽 반복(6·7번 줄)이 도는 동안은 올리지 않는다. 마지막 6번 줄 이벤트(반복이 끝나는 자리)가
        # 반복을 모두 마친 뒤의 값을 가진다.
        if st["group"] is not None:
            if line in (6, 7):
                st["last"] = cur
                return tracer
            rows[st["group"]][1:] = st["last"]
            st["group"] = None

        if line in (2, 3, 5, 6):
            rows.append([line, None, None, None])
            st["pending"] = len(rows) - 1
        elif line == 7:
            rows.append([7, None, None, None])
            st["group"] = len(rows) - 1
            st["last"] = cur
        elif line == 8 and not st["seen8"]:
            st["seen8"] = True
            rows.append([8, None, None, None])
            st["pending"] = len(rows) - 1
        return tracer

    sys.settrace(tracer)
    try:
        primes = fn(n)
    finally:
        sys.settrace(None)
    return primes, rows


def main():
    fn = make_fn()
    cases = []
    for c in CASES:
        primes, trace = trace_case(fn, c["n"])
        cases.append({"name": c["name"], "n": c["n"], "primes": primes, "trace": trace})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
