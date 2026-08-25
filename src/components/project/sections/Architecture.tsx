"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// 그림이 이미 이름을 가진 것들 — 노드 라벨과 subgraph 제목.
//
// 설명은 툴팁이 그림 위에서 말한다. 그림에 짝이 있는 설명을 아래에 카드로 또
// 깔면 같은 문장을 두 번 읽히는 셈이라, 여기서 뽑은 이름으로 걸러 낸다.
function parseLabels(code: string) {
  const out = new Set<string>();
  for (const raw of code.split("\n")) {
    const line = raw.trim();
    const sg = /^subgraph\s+([^\s[]+)(?:\[(.+?)\])?$/.exec(line);
    if (sg) {
      out.add(norm((sg[2] ?? sg[1]).trim()));
      continue;
    }
    if (line === "end" || line.startsWith("%%")) continue;
    // 노드 선언은 `ID[라벨]` · `ID[(라벨)]` · `ID(라벨)` 세 꼴로 온다.
    for (const m of line.matchAll(/([A-Za-z0-9_가-힣]+)\s*(?:\[\(?([^\]()]+)\)?\]|\(\(?([^)]+)\)?\))/g)) {
      out.add(norm(m[2] ?? m[3] ?? m[1]));
    }
  }
  return out;
}

// 구조 — 지금 돌아가는 물건이 어떤 덩어리로 나뉘고 그 사이로 무엇이 오가는가.
//
// 그림과 설명을 잇되 스크롤로는 잇지 않는다. 예전에는 판을 붙박아 두고 스크롤로
// 노드를 켰는데, 붙박인 판이 설명을 뒤로 깔아 가렸다. 지금은 포인터가 움직인다 —
// 노드나 덩어리에 올리면 그 설명이 그 자리에 뜬다.
//
// 그림이 말할 수 있는 것은 그림에게 맡긴다. 아래 카드에는 그림에 짝이 없는 설명만
// 남는다. 짝이 있는 것까지 카드로 깔면 툴팁과 같은 문장이 두 번 나온다.
export function Architecture({ diagram, steps }: { diagram: string | null; steps: Step[] }) {
  const [zoom, setZoom] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null);
  // 안내 — 그림이 화면에 들어오면 떴다가, 한 번 만져 보면 사라진다.
  const [coach, setCoach] = useState(false);
  const [touched, setTouched] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const labels = useMemo(() => (diagram ? parseLabels(diagram) : new Set<string>()), [diagram]);
  // 그림에 없는 설명만 카드로 남긴다.
  const orphans = useMemo(
    () => steps.filter((s) => !labels.has(norm(s.label))),
    [steps, labels],
  );

  // 설명에 손이 오면 짝이 되는 노드를 켠다. 이름으로 찾고, 없으면 상자를 본다.
  useEffect(() => {
    const svg = panelRef.current?.querySelector("svg");
    if (!svg) return;
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>("g.node"));
    const clusters = Array.from(svg.querySelectorAll<SVGGElement>("g.cluster"));
    const key = active === null ? "" : norm(steps[active]?.label ?? "");
    const hitNode = (key && nodes.find((n) => norm(n.textContent ?? "") === key)) || null;
    const hitCluster =
      (!hitNode && key && clusters.find((c) => norm(clusterName(c)) === key)) || null;
    nodes.forEach((n) => n.classList.toggle("lab-node-on", n === hitNode));
    clusters.forEach((c) => c.classList.toggle("lab-cluster-on", c === hitCluster));
  }, [active, steps, diagram]);

  // 설명이 딸린 노드·덩어리에 표시를 남긴다. 안내 문구만으로는 어디에 올려야
  // 하는지 모르므로, 커서 모양과 테두리로 "여긴 만져 볼 수 있다"를 그림 안에서 말한다.
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
      svg.querySelectorAll<SVGGElement>("g.cluster").forEach((c) => {
        c.classList.toggle("lab-cluster-linked", keys.has(norm(clusterName(c))));
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

  // 노드·덩어리에 손이 오면 그 설명을 그 자리에 띄운다. mermaid 가 비동기로
  // 그리므로 개별 요소에 붙이지 않고 패널에서 위임으로 받는다.
  const onPanelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const el = e.target as Element;
    const node = el.closest?.("g.node") as SVGGElement | null;
    const cluster = node ? null : (el.closest?.("g.cluster") as SVGGElement | null);
    const g = node ?? cluster;
    if (!g) {
      setTip(null);
      setActive(null);
      return;
    }
    setTouched(true);
    setCoach(false);
    const key = node ? norm(node.textContent ?? "") : norm(clusterName(cluster!));
    const i = steps.findIndex((s) => norm(s.label) === key);
    if (i < 0) {
      setTip(null);
      setActive(null);
      return;
    }
    const box = g.getBoundingClientRect();
    const host = panel.getBoundingClientRect();
    setActive(i);
    // 덩어리는 크다. 그 밑에 붙이면 설명이 그림 밖으로 나가므로 제목 옆에 세운다.
    const y = node ? box.bottom - host.top + 10 : box.top - host.top + 34;
    setTip({ i, x: box.left + box.width / 2 - host.left, y });
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
          className="lab-panel lab-corner lab-arch-panel lab-arch-skin"
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

          {/* 구조도는 본문 폭을 다 쓰는 판에 올라간다. 자연 폭에 멈추면 판 한가운데
              우표만 하게 앉으므로, 판을 다 쓰게 두고 글자도 한 단계 키운다. */}
          <Mermaid code={diagram} fontSize={16} fill />

          {coach && !tip && (
            <div className="lab-arch-coach" aria-hidden="true">
              <span className="dot" />
              그림에 올리면 설명이 보입니다
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
          </div>
        </div>
      )}

      {orphans.length > 0 && (
        <div className="lab-arch-steps">
          {orphans.map((s, i) => {
            const at = steps.indexOf(s);
            return (
              <div
                key={i}
                className={`lab-arch-step${at === active ? " on" : ""}`}
                onPointerEnter={() => setActive(at)}
                onPointerLeave={() => setActive((v) => (v === at ? null : v))}
              >
                <b>{s.label}</b>
                {s.md}
              </div>
            );
          })}
        </div>
      )}

      {zoom &&
        // 화면 전체를 덮는 판은 body 로 빼서 그린다. 섹션 안에 두면 조상 요소의
        // transform 하나에 position: fixed 가 그 요소 안으로 갇힌다.
        createPortal(
          <div className="lab-arch-modal" onClick={() => setZoom(false)} role="presentation">
            <button type="button" className="lab-arch-close" onClick={() => setZoom(false)}>
              닫기
            </button>
            <div
              className="lab-arch-modal-inner lab-arch-skin"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Mermaid code={diagram ?? ""} fontSize={18} fill />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// 덩어리 이름은 제목 라벨 하나다. textContent 를 그냥 쓰면 안에 든 노드 글자까지
// 딸려 와 어떤 설명과도 안 맞는다.
function clusterName(c: SVGGElement) {
  return c.querySelector(".cluster-label, .label")?.textContent ?? "";
}
