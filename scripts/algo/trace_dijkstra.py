"""다익스트라를 실제 Python 으로 돌려 줄 번호·변수 시퀀스를 뽑는다.

JS 구현(src/lib/algo/dijkstra.ts)이 같은 시퀀스를 내는지 대조하는 fixture 를 만든다.
결과를 커밋하므로 CI 에 Python 이 필요 없다. **코드를 고칠 때만 사람이 다시 돌린다.**

    python scripts/algo/trace_dijkstra.py

테이프는 while·for 머리줄(5·9번)과 `if d > dist[u]`(7번)를 스텝으로 올리지 않는다. 다 올리면 70스텝이 넘어
연타로 끝나기 때문이다. 그래서 여기서는 모든 줄을 기록하고, 대조하는 쪽(dijkstra.test.ts)이 올리는 줄만 거른다.
"""

import heapq
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "src" / "lib" / "algo" / "fixtures" / "dijkstra.json"

# src/lib/algo/dijkstra.ts 의 DIJK_CODE 와 한 글자도 다르면 안 된다. (`import heapq` 는 이 목록 밖, 맨 위에 둔다.)
CODE = [
    "def dijkstra(graph, start):",
    "    dist = {v: float('inf') for v in graph}",
    "    dist[start] = 0",
    "    heap = [(0, start)]",
    "    while heap:",
    "        d, u = heapq.heappop(heap)",
    "        if d > dist[u]:",
    "            continue",
    "        for v, w in graph[u]:",
    "            if d + w < dist[v]:",
    "                dist[v] = d + w",
    "                heapq.heappush(heap, (d + w, v))",
    "    return dist",
]

GRAPH = {
    "S": [("A", 2), ("B", 5)],
    "A": [("S", 2), ("B", 1), ("C", 5)],
    "B": [("S", 5), ("A", 1), ("D", 2)],
    "C": [("A", 5), ("E", 3)],
    "D": [("B", 2), ("E", 1)],
    "E": [("C", 3), ("D", 1)],
}

CASES = [
    {"name": "기본 지도 — S 에서 출발", "graph": GRAPH, "start": "S"},
    {"name": "한 줄짜리 길", "graph": {"S": [("A", 2)], "A": [("S", 2), ("B", 3)], "B": [("A", 3)]}, "start": "S"},
    {"name": "닿지 못하는 곳이 있음", "graph": {"S": [("A", 4)], "A": [("S", 4)], "C": []}, "start": "S"},
    {"name": "시간이 0 인 길", "graph": {"S": [("A", 0), ("B", 3)], "A": [("S", 0), ("B", 1)], "B": [("S", 3), ("A", 1)]}, "start": "S"},
    {"name": "시작점만 있음", "graph": {"S": []}, "start": "S"},
    {"name": "다른 곳에서 출발", "graph": GRAPH, "start": "E"},
]


def dijkstra(graph, start):
    dist = {v: float('inf') for v in graph}
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist


FIRST_LINE = dijkstra.__code__.co_firstlineno


def snapshot(loc, names):
    dist = loc.get("dist")
    dist_list = None if dist is None else [None if dist[n] == float('inf') else dist[n] for n in names]
    heap = loc.get("heap")
    heap_sorted = [] if heap is None else sorted([[d, n] for d, n in heap])
    return dist_list, heap_sorted


def trace_case(graph, start):
    """[[line, d, u, v, w, dist, heap], …] — dist 의 ∞ 는 None, heap 은 (거리, 곳) 순으로 정렬한 목록."""
    rows = []
    names = list(graph.keys())

    def tracer(frame, event, arg):
        if frame.f_code.co_name != "dijkstra":
            return None
        if event == "line":
            loc = frame.f_locals
            dist_list, heap_sorted = snapshot(loc, names)
            rows.append([
                frame.f_lineno - FIRST_LINE + 1,
                loc.get("d"),
                loc.get("u"),
                loc.get("v"),
                loc.get("w"),
                dist_list,
                heap_sorted,
            ])
        return tracer

    sys.settrace(tracer)
    try:
        result = dijkstra(graph, start)
    finally:
        sys.settrace(None)

    # 첫 줄(def 줄)은 JS 테이프에 없다. 3.12 이상은 2번 줄 딕셔너리 컴프리헨션이 원소마다 줄 이벤트를 내므로
    # 이어진 2번 줄은 한 행으로 합친다(버전과 상관없이 같은 fixture 가 나오게).
    out = []
    for r in rows:
        if r[0] == 1:
            continue
        if out and r[0] == 2 and out[-1][0] == 2:
            continue
        out.append(r)
    return out, {n: (None if result[n] == float('inf') else result[n]) for n in names}


def main():
    cases = []
    for c in CASES:
        trace, result = trace_case(c["graph"], c["start"])
        cases.append({
            "name": c["name"],
            "graph": {k: [list(e) for e in v] for k, v in c["graph"].items()},
            "start": c["start"],
            "trace": trace,
            "result": result,
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"code": CODE, "cases": cases}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{OUT} : {len(cases)} cases")


if __name__ == "__main__":
    main()
