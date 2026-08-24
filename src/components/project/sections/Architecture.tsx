"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mermaid } from "@/components/post/Mermaid";

export type Step = { label: string; md: string };

// 비교용 정규화 — 제목의 부연("Storage — 두 장을 만든다")은 앞부분만 남기고,
// 공백·기호를 지워 원고와 다이어그램의 사소한 표기 차이를 흡수한다.
function norm(s: string) {
  return s
    .split(/[—–\-:·|(]/)[0]
    .replace(/[\s_.,'"`*]/g, "")
    .toLowerCase();
}

// subgraph 로 그린 계층을 읽어 "이 노드는 어느 덩어리 소속인가"를 만든다.
// 설명 카드에 소속을 달아 주면, 그림을 안 봐도 어디 얘기인지 붙는다.
function parseLayers(code: string) {
  const layers: { name: string; nodes: Set<string> }[] = [];
  let cur: { name: string; nodes: Set<string> } | null = null;
  for (const raw of code.split("\n")) {
    const line = raw.trim();
    const sg = /^subgraph\s+([^\s[]+)(?:\[(.+?)\])?$/.exec(line);
    if (sg) {
      cur = { name: (sg[2] ?? sg[1]).trim(), nodes: new Set() };
      layers.push(cur);
      continue;
    }
    if (line === "end") {
      cur = null;
      continue;
    }
    if (!cur) continue;
    // 노드 선언은 `ID[라벨]` · `ID[(라벨)]` · `ID(라벨)` 세 꼴로 온다.
    for (const m of line.matchAll(/([A-Za-z0-9_가-힣]+)\s*(?:\[\(?([^\]()]+)\)?\]|\(\(?([^)]+)\)?\))/g)) {
      cur.nodes.add(norm(m[2] ?? m[3] ?? m[1]));
    }
  }
  return layers;
}

// 구조 — 지금 돌아가는 물건이 어떤 덩어리로 나뉘고 그 사이로 무엇이 오가는가.
//
// 그림과 설명을 잇되 스크롤로는 잇지 않는다. 예전에는 판을 붙박아 두고 스크롤로
// 노드를 켰는데, 붙박인 판이 설명을 뒤로 깔아 가렸다. 지금은 포인터가 움직인다 —
// 노드에 올리면 그 설명이 그 자리에 뜨고, 설명에 올리면 그 노드가 켜진다.
export function Architecture({ diagram, steps }: { diagram: string | null; steps: Step[] }) {
  const [zoom, setZoom] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null);
  // 안내 — 그림이 화면에 들어오면 떴다가, 한 번 만져 보면 사라진다.
  const [coach, setCoach] = useState(false);
  const [touched, setTouched] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const layers = useMemo(() => (diagram ? parseLayers(diagram) : []), [diagram]);
  const layerOf = useCallback(
    (label: string) => layers.find((l) => l.nodes.has(norm(label)))?.name ?? null,
    [layers],
  );

  // 설명에 손이 오면 짝이 되는 노드를 켠다. 이름으로 찾고, 없으면 상자를 본다.
  useEffect(() => {
    const svg = panelRef.current?.querySelector("svg");
    if (!svg) return;
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>("g.node"));
    const clusters = Array.from(svg.querySelectorAll<SVGGElement>("g.cluster"));
    const key = active === null ? "" : norm(steps[active]?.label ?? "");
    const hit =
      (key && nodes.find((n) => norm(n.textContent ?? "") === key)) ||
      (key && clusters.find((c) => norm(c.textContent ?? "") === key)) ||
      null;
    nodes.forEach((n) => n.classList.toggle("lab-node-on", n === hit));
    clusters.forEach((c) => c.classList.toggle("lab-cluster-on", c === hit));
  }, [active, steps, diagram]);

  // 설명이 딸린 노드에 표시를 남긴다. 안내 문구만으로는 어디에 올려야 하는지
  // 모르므로, 커서 모양과 테두리로 "여긴 눌러 볼 수 있다"를 그림 안에서 말한다.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      const svg = panelRef.current?.querySelector("svg");
      if (!svg) {
        raf = requestAnimationFrame(paint);
        return;
      }
      const keys = new Set(steps.map((x) => norm(x.label)));
      svg.querySelectorAll<SVGGElement>("g.node").forEach((n) => {
        n.classList.toggle("lab-node-linked", keys.has(norm(n.textContent ?? "")));
      });
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [steps, diagram]);

  // 그림이 화면에 들어오면 안내를 띄운다. 스크롤로 여기 닿은 순간이라야
  // 눈이 그림에 있다. 한 번 만져 봤으면 다시 띄우지 않는다.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || touched) return;
    const io = new IntersectionObserver(
      ([e]) => setCoach(e.isIntersecting),
      { rootMargin: "-15% 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [touched]);

  // 노드에 손이 오면 그 설명을 노드 옆에 띄운다. mermaid 가 비동기로 그리므로
  // 개별 노드에 붙이지 않고 패널에서 위임으로 받는다.
  const onPanelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const g = (e.target as Element).closest?.("g.node") as SVGGElement | null;
    if (!g) {
      setTip(null);
      setActive(null);
      return;
    }
    setTouched(true);
    setCoach(false);
    const key = norm(g.textContent ?? "");
    const i = steps.findIndex((s) => norm(s.label) === key);
    if (i < 0) {
      setTip(null);
      setActive(null);
      return;
    }
    const box = g.getBoundingClientRect();
    const host = panel.getBoundingClientRect();
    setActive(i);
    setTip({ i, x: box.left + box.width / 2 - host.left, y: box.bottom - host.top + 10 });
  };

  useEffect(() => {
    if (!zoom) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  return (
    <div className="lab-arch">
      {diagram && (
        <div
          className="lab-panel lab-corner lab-arch-panel"
          ref={panelRef}
          onPointerMove={onPanelMove}
          onPointerLeave={() => {
            setTip(null);
            setActive(null);
          }}
        >
          <div className="lab-arch-bar">
            <button type="button" className="lab-arch-zoom" onClick={() => setZoom(true)}>
              크게 보기
            </button>
          </div>

          {/* 구조도는 본문 폭을 다 쓰는 판에 올라가므로 글자를 한 단계 키운다. */}
          <Mermaid code={diagram} fontSize={16} />

          {coach && !tip && (
            <div className="lab-arch-coach" aria-hidden="true">
              <span className="dot" />
              노드에 올리면 설명이 보입니다
            </div>
          )}

          {tip && (
            <div className="lab-arch-tip" style={{ left: tip.x, top: tip.y }}>
              <b>{steps[tip.i].label}</b>
              <span>{steps[tip.i].md}</span>
            </div>
          )}

          <div className="lab-arch-legend">
            <span>
              <i className="solid" />
              보내는 것
            </span>
            <span>
              <i className="dashed" />
              되돌아오는 것
            </span>
            {layers.length > 0 && (
              <span className="layers">
                {layers.map((l) => (
                  <em key={l.name}>{l.name}</em>
                ))}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="lab-arch-steps">
        {steps.map((s, i) => {
          const layer = layerOf(s.label);
          return (
            <div
              key={i}
              className={`lab-arch-step${i === active ? " on" : ""}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive((v) => (v === i ? null : v))}
            >
              <b>
                {s.label}
                {layer && <span className="chip">{layer}</span>}
              </b>
              {s.md}
            </div>
          );
        })}
      </div>

      {zoom &&
        // 화면 전체를 덮는 판은 body 로 빼서 그린다. 섹션 안에 두면 조상 요소의
        // transform 하나에 position: fixed 가 그 요소 안으로 갇힌다.
        createPortal(
          <div className="lab-arch-modal" onClick={() => setZoom(false)} role="presentation">
            <button type="button" className="lab-arch-close" onClick={() => setZoom(false)}>
              닫기
            </button>
            <div
              className="lab-arch-modal-inner"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Mermaid code={diagram ?? ""} fontSize={18} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
