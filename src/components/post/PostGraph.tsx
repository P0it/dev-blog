"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, X } from "lucide-react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useTheme } from "@/lib/theme";
import type { GraphNode, PostGraph as PostGraphData } from "@/lib/types";

// 라벨 폭을 재서 충돌 반지름에 반영한다 — 안 그러면 긴 한글 제목끼리 겹쳐서
// 노드는 안 겹치는데 글씨는 못 읽는 그림이 나온다.
type SimNode = GraphNode & SimulationNodeDatum & { labelW?: number };
type SimLink = SimulationLinkDatum<SimNode>;

// 노드 반지름. 루트 > 카테고리 > 글 순으로 작아진다.
const RADIUS: Record<GraphNode["kind"], number> = { root: 7, category: 5.5, post: 4 };

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function fontFor(expanded: boolean) {
  return `${expanded ? 12.5 : 10.5}px system-ui, -apple-system, sans-serif`;
}

function labelOf(n: GraphNode, expanded: boolean) {
  if (!expanded) return n.kind === "post" ? truncate(n.label, 12) : n.label;
  return truncate(n.label, 26);
}

function adjacency(graph: PostGraphData) {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };
  for (const l of graph.links) {
    add(l.source, l.target);
    add(l.target, l.source);
  }
  return map;
}

/**
 * 지금 보는 글 둘레만 잘라 낸 부분 그래프.
 * 작은 판에 전체를 욱여넣으면 점 뭉치가 되어 아무것도 안 읽힌다 — 그래서
 * 작은 판은 이웃까지만 맡고, 전체는 펼친 판이 보여 준다.
 */
function neighborhood(graph: PostGraphData, centerId: string, depth: number): PostGraphData {
  const adj = adjacency(graph);
  if (!adj.has(centerId)) return graph;
  const keep = new Set([centerId]);
  let frontier = [centerId];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const nb of adj.get(id) ?? []) {
        if (keep.has(nb)) continue;
        keep.add(nb);
        next.push(nb);
      }
    }
    frontier = next;
  }
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    links: graph.links.filter((l) => keep.has(l.source) && keep.has(l.target)),
  };
}

type Palette = {
  node: string;
  nodeStrong: string;
  edge: string;
  label: string;
  labelStrong: string;
};

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    node: v("--fg-alternative") || "#888",
    nodeStrong: v("--fg-strong") || "#111",
    edge: v("--line-normal") || "#ddd",
    label: v("--fg-alternative") || "#888",
    labelStrong: v("--fg-strong") || "#111",
  };
}

/**
 * 캔버스 하나에 힘 기반 배치를 그린다.
 * 사이드의 작은 판과 펼친 큰 판이 이 컴포넌트를 각각 하나씩 쓴다 — 노드가
 * 수십 개뿐이라 시뮬레이션을 둘 돌려도 부담이 없고, 판마다 확대·이동 상태를
 * 따로 갖는 편이 오히려 자연스럽다.
 */
function GraphCanvas({
  graph,
  activeSlug,
  expanded,
  onPick,
}: {
  graph: PostGraphData;
  activeSlug?: string;
  expanded: boolean;
  onPick: (node: SimNode) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  // 렌더 루프가 매 프레임 읽는 값들은 state 로 두면 리렌더가 따라붙는다.
  const view = useRef({ x: 0, y: 0, k: 1 });
  const fitted = useRef(false);
  const hover = useRef<SimNode | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [cursor, setCursor] = useState<"grab" | "pointer">("grab");

  // 시뮬레이션 입력은 매 렌더마다 새로 만들면 배치가 튄다. graph 가 바뀔 때만.
  const { nodes, links, adj } = useMemo(() => {
    const ns: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const byId = new Map(ns.map((n) => [n.id, n]));
    const ls: SimLink[] = graph.links
      .filter((l) => byId.has(l.source) && byId.has(l.target))
      .map((l) => ({ source: byId.get(l.source)!, target: byId.get(l.target)! }));
    return { nodes: ns, links: ls, adj: adjacency(graph) };
  }, [graph]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    // 사용자가 아직 손대지 않았으면 그래프 전체가 들어오게 자동으로 맞춘다.
    if (!fitted.current) {
      const xs = nodes.map((n) => n.x ?? 0);
      const ys = nodes.map((n) => n.y ?? 0);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = expanded ? 40 : 14;
      const fit = (right: number) =>
        Math.min(
          (w - pad * 2) / Math.max(right - minX, 1),
          (h - pad * 2) / Math.max(maxY - minY, 1),
          expanded ? 1.6 : 1.4,
        );
      // 라벨은 확대율과 무관하게 화면상 폭이 같아서, 그래프 좌표로는 배율만큼
      // 오른쪽으로 더 삐져나온다. 한 번 재보고 그 폭까지 넣어 다시 맞춘다 —
      // 이걸 빼면 가장자리 글자가 잘린다.
      const widest = Math.max(
        0,
        ...nodes
          // 작은 판에서 라벨이 붙는 건 카테고리와 지금 보는 글뿐이다.
          .filter((n) => expanded || n.kind !== "post" || n.slug === activeSlug)
          .map((n) => n.labelW ?? 0),
      );
      const k = fit(maxX + widest / fit(maxX));
      const right = maxX + widest / k;
      view.current = {
        k,
        x: w / 2 - ((minX + right) / 2) * k,
        y: h / 2 - ((minY + maxY) / 2) * k,
      };
    }

    const p = readPalette(wrap);
    const { x: tx, y: ty, k } = view.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(tx, ty);
    ctx.scale(k, k);

    // 한 노드에 커서를 얹으면 이어진 것만 남기고 나머지는 흐린다.
    const focus = hover.current;
    const near = focus ? new Set([focus.id, ...(adj.get(focus.id) ?? [])]) : null;

    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 1 / k;
    for (const lit of near ? [true, false] : [true]) {
      ctx.globalAlpha = lit ? 1 : 0.22;
      ctx.beginPath();
      let drew = false;
      for (const l of links) {
        const s = l.source as SimNode;
        const t = l.target as SimNode;
        const on = !near || s.id === focus!.id || t.id === focus!.id;
        if (on !== lit) continue;
        ctx.moveTo(s.x ?? 0, s.y ?? 0);
        ctx.lineTo(t.x ?? 0, t.y ?? 0);
        drew = true;
      }
      if (drew) ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 확대해도 글씨 크기는 그대로 두려고 그래프 좌표계 배율만큼 나눠 준다.
    ctx.font = `${(expanded ? 12.5 : 10.5) / k}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = "middle";

    for (const n of nodes) {
      const isActive = n.kind === "post" && n.slug === activeSlug;
      const isHover = focus?.id === n.id;
      const strong = isActive || isHover || n.kind !== "post";
      const r = RADIUS[n.kind] + (isActive ? 1.5 : 0);
      ctx.globalAlpha = near && !near.has(n.id) ? 0.22 : 1;

      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, Math.PI * 2);
      ctx.fillStyle = strong ? p.nodeStrong : p.node;
      ctx.fill();
      if (isActive) {
        // 지금 보는 글은 테두리를 둘러 한눈에 찾게 한다.
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, r + 3.5, 0, Math.PI * 2);
        ctx.lineWidth = 1.5 / k;
        ctx.strokeStyle = p.nodeStrong;
        ctx.stroke();
      }

      // 작은 판에서 글 제목까지 다 찍으면 글씨가 서로 겹쳐 못 읽는다.
      const showLabel = expanded || n.kind !== "post" || isActive || isHover;
      if (showLabel) {
        ctx.fillStyle = strong ? p.labelStrong : p.label;
        ctx.fillText(labelOf(n, expanded), (n.x ?? 0) + r + 5 / k, (n.y ?? 0) + 0.5);
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [nodes, links, adj, activeSlug, expanded, theme]);

  // 시뮬레이션 — graph·펼침 상태가 바뀔 때만 새로 돌린다.
  useEffect(() => {
    const meter = document.createElement("canvas").getContext("2d");
    if (meter) {
      meter.font = fontFor(expanded);
      for (const n of nodes) n.labelW = meter.measureText(labelOf(n, expanded)).width;
    }
    // 라벨이 보이는 노드만 그 폭만큼 자리를 넓게 잡는다.
    const spread = (n: SimNode) => {
      const shows = expanded || n.kind !== "post" || n.slug === activeSlug;
      return RADIUS[n.kind] + 10 + (shows ? (n.labelW ?? 0) * (expanded ? 0.45 : 0.55) : 0);
    };

    const sim: Simulation<SimNode, SimLink> = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          // 카테고리 가지는 길게, 글은 짧게 붙여 가지 모양이 살게 한다.
          .distance((l) => ((l.target as SimNode).kind === "post" ? 62 : 126))
          .strength(1),
      )
      .force("charge", forceManyBody().strength(expanded ? -340 : -190))
      .force("collide", forceCollide<SimNode>(spread).strength(0.9))
      .force("center", forceCenter(0, 0))
      .on("tick", draw);
    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [nodes, links, draw, expanded, activeSlug]);

  // 크기가 바뀌면 다시 맞춰 그린다.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      fitted.current = false;
      draw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const toGraph = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x, y, k } = view.current;
    return {
      x: (e.clientX - rect.left - x) / k,
      y: (e.clientY - rect.top - y) / k,
    };
  };

  const nodeAt = (e: { clientX: number; clientY: number }): SimNode | null => {
    const pt = toGraph(e);
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const d = Math.hypot((n.x ?? 0) - pt.x, (n.y ?? 0) - pt.y);
      // 마우스·손가락 모두 집을 수 있게 화면상 7px 만큼 여유를 준다.
      const hit = RADIUS[n.kind] + 7 / view.current.k;
      if (d < hit && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  };

  // 노드를 잡으면 그 노드를 끌고, 빈 곳을 잡으면 판 전체를 민다.
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
    node: SimNode | null;
  } | null>(null);

  return (
    <div ref={wrapRef} className="pg-canvas-wrap">
      <canvas
        ref={canvasRef}
        style={{ cursor, touchAction: "none", display: "block" }}
        role="img"
        aria-label="글 사이의 연결을 보여 주는 지식 그래프"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const node = nodeAt(e);
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, node };
          if (node) simRef.current?.alphaTarget(0.3).restart();
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && d.id === e.pointerId) {
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            if (d.node) {
              const pt = toGraph(e);
              d.node.fx = pt.x;
              d.node.fy = pt.y;
            } else {
              view.current.x += dx;
              view.current.y += dy;
              fitted.current = true;
            }
            d.x = e.clientX;
            d.y = e.clientY;
            draw();
            return;
          }
          const hit = nodeAt(e);
          if (hit?.id !== hover.current?.id) {
            hover.current = hit;
            setCursor(hit ? "pointer" : "grab");
            draw();
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          if (d.node) {
            // 놓으면 다시 물리에 맡긴다 — 붙잡아 두면 배치가 굳어 어색하다.
            d.node.fx = null;
            d.node.fy = null;
            simRef.current?.alphaTarget(0);
          }
          if (!d.moved) {
            const hit = d.node ?? nodeAt(e);
            if (hit) onPick(hit);
          }
        }}
        onPointerLeave={() => {
          drag.current = null;
          if (hover.current) {
            hover.current = null;
            setCursor("grab");
            draw();
          }
        }}
        onWheel={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          const { x, y, k } = view.current;
          const next = Math.min(6, Math.max(0.25, k * Math.exp(-e.deltaY * 0.0015)));
          // 커서가 가리키던 지점이 제자리에 남도록 이동값을 같이 보정한다.
          view.current = {
            k: next,
            x: px - ((px - x) / k) * next,
            y: py - ((py - y) / k) * next,
          };
          fitted.current = true;
          draw();
        }}
      />
    </div>
  );
}

export function PostGraph({
  graph,
  activeSlug,
}: {
  graph: PostGraphData;
  activeSlug?: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // 작은 판은 이 글의 둘레(제 카테고리와 형제 글)까지만 보여 준다.
  const local = useMemo(
    () => (activeSlug ? neighborhood(graph, `p:${activeSlug}`, 2) : graph),
    [graph, activeSlug],
  );

  const pick = useCallback(
    (node: SimNode) => {
      setExpanded(false);
      router.push(node.href);
    },
    [router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      // Quartz 와 같은 자리 — 전체 그래프를 여닫는 단축키.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setExpanded((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    // 펼친 동안 뒤 본문이 같이 스크롤되지 않게 잠근다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  if (graph.nodes.length < 3) return null;

  return (
    <div className="post-graph">
      <div className="post-graph-head">
        <span className="t-overline">글 그래프</span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="전체 그래프 펼치기 (Ctrl+G)"
          title="전체 그래프 (Ctrl+G)"
        >
          <Maximize2 size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="post-graph-mini">
        <GraphCanvas graph={local} activeSlug={activeSlug} expanded={false} onPick={pick} />
      </div>

      {expanded && (
        <div
          className="post-graph-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="글 그래프"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpanded(false);
          }}
        >
          <div className="post-graph-sheet">
            <button
              type="button"
              className="post-graph-close"
              onClick={() => setExpanded(false)}
              aria-label="닫기"
            >
              <X size={18} strokeWidth={2} />
            </button>
            <GraphCanvas graph={graph} activeSlug={activeSlug} expanded onPick={pick} />
          </div>
        </div>
      )}
    </div>
  );
}
