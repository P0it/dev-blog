"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// 가만히 둔 그래프가 계속 일렁이는 정도. 진폭을 키우면 라벨이 서로 넘나들어
// 읽기 나빠지고, 0 이면 그림이 굳어 죽어 보인다. 화면 맞춤은 처음 한 번만
// 하므로, 이 일렁임이 커지면 가장자리에서 그림이 잘린다 — DRIFT_ROOM 이
// 그만큼 여백을 미리 떼어 둔다. 둘은 같이 움직여야 한다.
const DRIFT = 0.18;
const DRIFT_ROOM = 26;
// 이 값을 0 위로 유지해야 d3 타이머가 안 멈춘다. 동시에 링크·충돌 같은
// 되돌리는 힘도 이 세기로 계속 걸려서 배치가 흐트러지지 않는다.
const IDLE_ALPHA = 0.12;

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

const LABEL_PX = (expanded: boolean) => (expanded ? 12.5 : 10.5);

function fontFor(expanded: boolean) {
  return `${LABEL_PX(expanded)}px system-ui, -apple-system, sans-serif`;
}

function labelOf(n: GraphNode, expanded: boolean) {
  if (!expanded) return n.kind === "post" ? truncate(n.label, 12) : n.label;
  return truncate(n.label, 18);
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
  accent: string;
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
    // 지금 보는 글에 쓰는 테마색. -strong 쪽은 라이트에서 mint-600 이라
    // 흰 바탕에서도 또렷하고, 다크에서는 mint-500 그대로 밝게 뜬다.
    accent: v("--fg-primary-strong") || "#1e8063",
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
  // 화면 맞춤은 두 가지를 따로 기억한다. autoFit 은 "아직 사용자가 손대지
  // 않았다", needsFit 은 "이번 그리기에서 한 번 다시 맞춰라". 매 tick 마다
  // 맞추면 배치가 자리를 잡는 동안 화면이 같이 출렁여서 튕겨 보인다.
  const autoFit = useRef(true);
  const needsFit = useRef(true);
  const hover = useRef<SimNode | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const onScreen = useRef(true);
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

    // 사용자가 아직 손대지 않았고, 다시 맞추라는 표시가 있을 때만 맞춘다.
    if (autoFit.current && needsFit.current) {
      needsFit.current = false;
      const xs = nodes.map((n) => n.x ?? 0);
      const ys = nodes.map((n) => n.y ?? 0);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = (expanded ? 40 : 14) + DRIFT_ROOM;
      const cap = expanded ? 1.6 : 1.4;
      const widest = Math.max(
        0,
        ...nodes
          // 작은 판에서 라벨이 붙는 건 카테고리뿐이다.
          .filter((n) => expanded || n.kind !== "post")
          .map((n) => n.labelW ?? 0),
      );
      // 라벨은 확대율과 무관하게 화면상 폭이 같아서, 그래프 좌표로는 배율이
      // 작아질수록 더 넓게 삐져나온다. 폭과 배율이 서로를 물고 있으니 몇 번
      // 되풀이해 맞추고, 마지막에 남는 짝으로 가운데를 잡는다 — 따로 계산하면
      // 그만큼 한쪽이 잘린다.
      const boundsAt = (k: number) => {
        const half = widest / 2 / k;
        return {
          l: minX - half,
          r: maxX + half,
          t: minY - RADIUS.root,
          b: maxY + (LABEL_PX(expanded) * 1.8) / k,
        };
      };
      let k = cap;
      for (let i = 0; i < 4; i++) {
        const bb = boundsAt(k);
        k = Math.min(
          (w - pad * 2) / Math.max(bb.r - bb.l, 1),
          (h - pad * 2) / Math.max(bb.b - bb.t, 1),
          cap,
        );
      }
      const bb = boundsAt(k);
      view.current = {
        k,
        x: w / 2 - ((bb.l + bb.r) / 2) * k,
        y: h / 2 - ((bb.t + bb.b) / 2) * k,
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
    ctx.font = `${LABEL_PX(expanded) / k}px system-ui, -apple-system, sans-serif`;
    // 라벨은 노드 아래 가운데에 놓는다. 오른쪽에 붙이면 충돌 반지름(노드를
    // 중심으로 한 원)이 글씨가 뻗는 방향을 못 담아서, 점은 안 겹치는데 글씨만
    // 겹치는 그림이 계속 남는다.
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (const n of nodes) {
      const isActive = n.kind === "post" && n.slug === activeSlug;
      const isHover = focus?.id === n.id;
      const strong = isActive || isHover || n.kind !== "post";
      const r = RADIUS[n.kind] + (isActive ? 1.5 : 0);
      ctx.globalAlpha = near && !near.has(n.id) ? 0.22 : 1;

      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? p.accent : strong ? p.nodeStrong : p.node;
      ctx.fill();
      if (isActive) {
        // 지금 보는 글은 테마색 점에 같은 색 테두리를 둘러 한눈에 찾게 한다.
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, r + 4, 0, Math.PI * 2);
        ctx.lineWidth = 2 / k;
        ctx.strokeStyle = p.accent;
        ctx.stroke();
      }

      // 작은 판에서 글 제목까지 다 찍으면 200px 안에서 글씨가 겹쳐 못 읽는다.
      // 지금 보는 글은 라벨 없이 링으로만 표시한다 — 어차피 읽고 있는 글이라
      // 제목이 한 번 더 필요하지 않고, 그게 판에서 제일 긴 라벨이다.
      const showLabel = expanded || n.kind !== "post" || isHover;
      if (showLabel) {
        ctx.fillStyle = isActive ? p.accent : strong ? p.labelStrong : p.label;
        ctx.fillText(labelOf(n, expanded), n.x ?? 0, (n.y ?? 0) + r + 4 / k);
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
      const shows = expanded || n.kind !== "post";
      if (!shows) return RADIUS[n.kind] + 9;
      // labelW 는 화면 픽셀인데 여기 반지름은 그래프 좌표다. 배율이 1 보다
      // 작게 잡히면 라벨이 그 비율만큼 더 넓어지므로 여유를 곱해 둔다 —
      // 안 그러면 작은 판처럼 축소되는 쪽에서 글씨가 계속 겹친다.
      return Math.max(RADIUS[n.kind] + 9, (n.labelW ?? 0) * 0.5 * 1.4 + 6);
    };

    // 한 카테고리에 매달린 글 수를 센다. 가지 길이를 이 수에 맞춰 늘려야
    // 자식들이 부모 둘레에 늘어설 자리가 생긴다 — 길이를 고정하면 링크 힘이
    // 전부 같은 반지름에 묶어 두고, 밀어내는 힘은 그걸 못 이겨 글씨가 겹친다.
    const childCount = new Map<string, number>();
    for (const l of links) {
      const s = (l.source as SimNode).id;
      childCount.set(s, (childCount.get(s) ?? 0) + 1);
    }

    const sim: Simulation<SimNode, SimLink> = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            const t = l.target as SimNode;
            if (t.kind !== "post") return 140;
            const n = childCount.get((l.source as SimNode).id) ?? 1;
            // 자식 n 개가 라벨 폭만큼 떨어져 둘러서려면 반지름이 대략 n·w/2π 다.
            const room = expanded ? 78 : 34;
            return Math.min(340, Math.max(70, (n * room) / Math.PI));
          })
          .strength(1),
      )
      .force("charge", forceManyBody().strength(expanded ? -340 : -190))
      // 반복 횟수를 올려야 라벨끼리 실제로 밀어낸다(기본 1회로는 덜 풀린다).
      .force("collide", forceCollide<SimNode>(spread).strength(1).iterations(3))
      .force("center", forceCenter(0, 0))
      // 흔들림을 빨리 죽인다. 기본값(0.4)이면 자리를 잡고도 한참 출렁인다.
      .velocityDecay(0.55)
      .stop();

    // 화면에 붙이기 전에 미리 다 돌려 자리를 잡아 둔다. 켜자마자 날아다니다
    // 멈추는 그림이 "튕긴다"는 인상의 대부분이라, 아예 정착한 상태로 띄운다.
    sim.tick(500);
    needsFit.current = true;
    draw();

    // 자리를 잡은 뒤에는 아주 약하게 계속 흔든다. 완전히 굳어 있으면 그림이
    // 죽어 보이는데, 진폭을 작게 두고 원래 힘들(링크·척력·충돌)을 살려 두면
    // 제자리 근처에서만 일렁여서 배치는 그대로 유지된다.
    const born = performance.now();
    sim.force("drift", () => {
      const t = (performance.now() - born) / 1000;
      nodes.forEach((n, i) => {
        if (n.fx != null) return; // 끌고 있는 노드는 건드리지 않는다
        n.vx = (n.vx ?? 0) + Math.cos(t * 0.5 + i * 1.3) * DRIFT;
        n.vy = (n.vy ?? 0) + Math.sin(t * 0.42 + i * 2.1) * DRIFT;
      });
    });
    // alphaTarget 을 0 위로 두면 타이머가 멈추지 않아 계속 일렁인다.
    sim.on("tick", draw).alpha(IDLE_ALPHA).alphaTarget(IDLE_ALPHA).restart();
    simRef.current = sim;

    // 화면 밖이거나 탭이 가려지면 세운다 — 안 보이는 그림을 계속 돌릴 이유가 없다.
    const wrap = wrapRef.current;
    const awake = () => {
      const visible = !document.hidden && onScreen.current;
      if (visible) sim.alphaTarget(IDLE_ALPHA).restart();
      else sim.stop();
    };
    const io = wrap
      ? new IntersectionObserver(([e]) => {
          onScreen.current = e.isIntersecting;
          awake();
        })
      : null;
    if (io && wrap) io.observe(wrap);
    document.addEventListener("visibilitychange", awake);

    return () => {
      document.removeEventListener("visibilitychange", awake);
      io?.disconnect();
      sim.stop();
      simRef.current = null;
    };
  }, [nodes, links, draw, expanded, activeSlug]);

  // 크기가 바뀌면 다시 맞춰 그린다.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      needsFit.current = true;
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
    const k = view.current.k;
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const d = Math.hypot((n.x ?? 0) - pt.x, (n.y ?? 0) - pt.y);
      // 점만 노리게 하면 글 노드는 반지름이 4라 도저히 못 집는다.
      // 화면상 14px 만큼 넉넉히 준다.
      if (d < RADIUS[n.kind] + 14 / k && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    if (best) return best;

    // 점을 빗나갔으면 라벨 글씨도 과녁으로 친다 — 실제로 눈에 보이는 건
    // 점보다 제목 쪽이라, 제목을 눌렀는데 아무 일도 안 나면 고장으로 읽힌다.
    const fontH = LABEL_PX(expanded) / k;
    for (const n of nodes) {
      const shown = expanded || n.kind !== "post";
      if (!shown || !n.labelW) continue;
      const left = (n.x ?? 0) - n.labelW / 2 / k;
      const top = (n.y ?? 0) + RADIUS[n.kind] + 3 / k;
      if (
        pt.x >= left &&
        pt.x <= left + n.labelW / k &&
        pt.y >= top &&
        pt.y <= top + fontH * 1.3
      ) {
        return n;
      }
    }
    return null;
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
              autoFit.current = false;
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
            simRef.current?.alphaTarget(IDLE_ALPHA);
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
          autoFit.current = false;
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

      {/* 펼친 판은 body 로 빼서 그린다. 이 컴포넌트가 들어앉은 .post-toc 이
          position: sticky 라 그 자체로 쌓임 맥락을 만드는데, 그 안에 두면
          z-index 를 아무리 올려도 그 맥락 밖(내비게이션 등)으로는 못 올라온다. */}
      {expanded &&
        createPortal(
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
        </div>,
        document.body,
      )}
    </div>
  );
}
