"use client";

import { useEffect, useId, useRef, useState } from "react";

// 토큰을 읽어 mermaid themeVariables에 박는다. 색 manipulation 대상은 var() 대신
// 실제 값이어야 하므로 init 시점에 getComputedStyle로 해석한다.
function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    fgStrong: v("--fg-strong"),
    fgNormal: v("--fg-normal"),
    fgNeutral: v("--fg-neutral"),
    bgBase: v("--bg-base"),
    bgSubtle: v("--bg-subtle"),
    bgMuted: v("--bg-muted"),
    line: v("--line-normal"),
    blueFill: v("--diag-blue-fill"),
    blueStroke: v("--diag-blue-stroke"),
    purpleFill: v("--diag-purple-fill"),
    purpleStroke: v("--diag-purple-stroke"),
    tealFill: v("--diag-teal-fill"),
    tealStroke: v("--diag-teal-stroke"),
    greenFill: v("--diag-green-fill"),
    greenStroke: v("--diag-green-stroke"),
    yellowFill: v("--diag-yellow-fill"),
    yellowStroke: v("--diag-yellow-stroke"),
    redFill: v("--diag-red-fill"),
    redStroke: v("--diag-red-stroke"),
    muteFill: v("--diag-mute-fill"),
    muteStroke: v("--diag-mute-stroke"),
    edge: v("--diag-edge"),
    clusterBg: v("--diag-cluster-bg"),
  };
}

type Tokens = ReturnType<typeof readTokens>;

function buildConfig(t: Tokens, fontSize = 14) {
  // 폰트 패밀리는 mermaid가 텍스트 너비 측정에도 쓴다. var()는 측정 시점에
  // 해석되지 않아 시스템 폰트로 잰 뒤 실제로는 Pretendard로 그려져 한글이
  // 노드 너비를 넘어선다. 실제 해석된 값(Pretendard 등)을 직접 넣어 측정과
  // 렌더 폰트를 일치시킨다.
  const fontFamily =
    getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim() ||
    "system-ui, sans-serif";

  return {
    startOnLoad: false,
    securityLevel: "strict" as const,
    theme: "base" as const,
    fontFamily,
    flowchart: {
      curve: "basis" as const,
      // 세로(TD) 흐름도는 rank 간격이 곧 전체 높이다. 60 이면 노드 예닐곱 개에
      // 높이가 900px 을 넘어, 패널에 맞추느라 통째로 축소돼 글자가 안 읽힌다.
      padding: 16,
      nodeSpacing: 40,
      rankSpacing: 38,
      useMaxWidth: true,
      htmlLabels: true, // 한글 너비 정확히 잡으려면 HTML 라벨 필수
    },
    sequence: { useMaxWidth: true, mirrorActors: false, actorFontFamily: fontFamily, noteFontFamily: fontFamily, messageFontFamily: fontFamily },
    themeVariables: {
      fontFamily,
      fontSize: `${fontSize}px`,
      background: t.bgBase,
      // 기본 노드 (지정 클래스 없을 때) — 블루 톤
      primaryColor: t.blueFill,
      primaryBorderColor: t.blueStroke,
      primaryTextColor: t.fgStrong,
      // 보조 — 퍼플
      secondaryColor: t.purpleFill,
      secondaryBorderColor: t.purpleStroke,
      secondaryTextColor: t.fgStrong,
      // 3차 — 티얼
      tertiaryColor: t.tealFill,
      tertiaryBorderColor: t.tealStroke,
      tertiaryTextColor: t.fgStrong,
      // 엣지/선
      lineColor: t.edge,
      textColor: t.fgNormal,
      mainBkg: t.blueFill,
      nodeBorder: t.blueStroke,
      // 클러스터(서브그래프)
      clusterBkg: t.clusterBg,
      clusterBorder: t.line,
      // 엣지 라벨
      edgeLabelBackground: t.bgBase,
      // 시퀀스 다이어그램
      actorBkg: t.blueFill,
      actorBorder: t.blueStroke,
      actorTextColor: t.fgStrong,
      actorLineColor: t.edge,
      signalColor: t.fgNormal,
      signalTextColor: t.fgNormal,
      labelBoxBkgColor: t.bgSubtle,
      labelBoxBorderColor: t.line,
      labelTextColor: t.fgStrong,
      loopTextColor: t.fgStrong,
      activationBkgColor: t.purpleFill,
      activationBorderColor: t.purpleStroke,
      sequenceNumberColor: t.fgStrong,
      noteBkgColor: t.yellowFill,
      noteBorderColor: t.yellowStroke,
      noteTextColor: t.fgStrong,
    },
    // 라이트/다크 양쪽에서 토큰이 살아 있는 var()로 후처리.
    // mermaid는 themeCSS를 SVG <style>에 그대로 주입하므로 CSS 변수 cascade가 작동.
    themeCSS: `
      /* 보더 굵게, 코너 둥글게. 컬러 보더가 시각의 중심이 된다. */
      .node rect, .node polygon, .node circle, .node ellipse, .node path { stroke-width: 2px; }
      .node rect { rx: 10; ry: 10; }
      .node .label, .node text, .node foreignObject div { fill: var(--fg-strong); color: var(--fg-strong); font-weight: 500; line-height: 1.5; }

      /* foreignObject 내부 div가 가장 긴 줄에 맞게 측정되도록 강제.
         이게 없으면 mermaid가 첫 줄(혹은 짧은 줄) 기준으로 너비를 잡아 한글이 짤린다.
         max-width로 카드가 무한히 넓어지지 않게 상한선. */
      .node foreignObject > div { width: max-content; max-width: 320px; white-space: normal; }
      .node foreignObject p { margin: 0; white-space: nowrap; }

      /* markdown 문자열에서 **굵게** → <strong>. 첫 줄을 타이틀로 쓰면
         클래스 색이 자동으로 입혀진다. 본문은 fg-strong.
         ⚠ font-size를 키우면 mermaid 측정값과 어긋나 박스 밖으로 텍스트가 새어 나간다.
         색·굵게만 변경한다(size·letter-spacing 변경 ✗). */
      .node foreignObject strong { display: block; font-weight: 700; margin-bottom: 4px; }
      .node foreignObject em { font-style: italic; font-weight: 600; }

      .edgeLabel, .edgeLabel foreignObject div { background-color: var(--bg-base); color: var(--fg-normal); padding: 2px 8px; border-radius: 4px; font-weight: 500; }
      .edgeLabel rect { fill: var(--bg-base); }
      .flowchart-link, .messageLine0, .messageLine1 { stroke: var(--diag-edge); }
      marker, marker path { fill: var(--diag-edge); stroke: var(--diag-edge); }
      .cluster rect { fill: var(--diag-cluster-bg); stroke: var(--line-normal); stroke-dasharray: 4 4; rx: 12; ry: 12; }
      .cluster .label, .cluster text { fill: var(--fg-strong); font-weight: 600; }

      /* 클래스별 팔레트 — 보더·타이틀 색 동시 적용.
         POSTING.md가 이 이름을 약속한다(class A,B primary). */
      .node.primary rect, .node.primary polygon, .node.primary circle, .node.primary ellipse, .node.primary path { fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); }
      .node.primary foreignObject strong { color: var(--diag-blue-stroke); }

      .node.accent  rect, .node.accent  polygon, .node.accent  circle, .node.accent  ellipse, .node.accent  path { fill: var(--diag-purple-fill); stroke: var(--diag-purple-stroke); }
      .node.accent  foreignObject strong { color: var(--diag-purple-stroke); }

      .node.info    rect, .node.info    polygon, .node.info    circle, .node.info    ellipse, .node.info    path { fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); }
      .node.info    foreignObject strong { color: var(--diag-teal-stroke); }

      .node.success rect, .node.success polygon, .node.success circle, .node.success ellipse, .node.success path { fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); }
      .node.success foreignObject strong { color: var(--diag-green-stroke); }

      .node.warn    rect, .node.warn    polygon, .node.warn    circle, .node.warn    ellipse, .node.warn    path { fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); }
      .node.warn    foreignObject strong { color: var(--diag-yellow-stroke); }

      .node.danger  rect, .node.danger  polygon, .node.danger  circle, .node.danger  ellipse, .node.danger  path { fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); }
      .node.danger  foreignObject strong { color: var(--diag-red-stroke); }

      .node.mute    rect, .node.mute    polygon, .node.mute    circle, .node.mute    ellipse, .node.mute    path { fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); }
      .node.mute    foreignObject strong { color: var(--diag-mute-stroke); }
    `,
  };
}

// 그림을 제 크기보다 크게 그리지 않는다.
//
// mermaid 는 `useMaxWidth` 로 그린 svg 의 인라인 style 에 자연 폭을 max-width 로 남기고
// width 는 100% 로 둔다. 그 상한을 CSS 로 덮으면 노드 두어 개짜리 그림이 판 폭까지
// 늘어나 글자만 커다래진다. 그래서 상한을 판(figure) 쪽으로 옮겨 단다 —
// 작은 그림은 제 크기에서 멈추고 가운데 서고, 큰 그림은 판 폭에 맞춰 줄어든다.
function fitToNaturalWidth(host: HTMLDivElement) {
  const svg = host.querySelector("svg");
  if (!svg) return;
  const natural = parseFloat(svg.style.maxWidth || "");
  host.style.maxWidth = Number.isFinite(natural) && natural > 0 ? `${Math.round(natural)}px` : "";
  svg.style.maxWidth = "100%";
  svg.style.width = "100%";
}

// 판을 다 쓰게 둔다.
//
// 구조도는 본문 폭을 통째로 내준 판 위에 올라간다. 거기서 자연 폭에 멈추면
// 노드 몇 개짜리 그림이 판 한가운데 우표만 하게 앉아 아무것도 안 읽힌다.
// 그림은 벡터라 키워도 흐려지지 않으므로, 이 자리에서는 판 폭까지 늘린다.
function fillHost(host: HTMLDivElement) {
  const svg = host.querySelector("svg");
  if (!svg) return;
  host.style.maxWidth = "";
  svg.style.maxWidth = "100%";
  svg.style.width = "100%";
}

// fontSize 는 구조도처럼 큰 판에 올리는 그림에서 올린다. mermaid 가 이 값으로
// 노드 너비까지 재기 때문에, CSS 로 키우면 글자가 상자를 넘는다.
export function Mermaid({
  code,
  fontSize,
  fill = false,
}: {
  code: string;
  fontSize?: number;
  /** 자연 폭에 멈추지 않고 판 폭을 다 쓴다. 구조도처럼 큰 판에 올릴 때만. */
  fill?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // 테마 토글 → data-theme 속성 변경 → 다이어그램 재렌더.
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((n) => n + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pretendard 등 커스텀 폰트가 로드된 뒤에 측정/렌더해야
        // 한글 노드/엣지 라벨이 너비 안에 맞게 그려진다.
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize(buildConfig(readTokens(), fontSize));
        const { svg } = await mermaid.render(`m-${id}-${tick}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          if (fill) fillHost(ref.current);
          else fitToNaturalWidth(ref.current);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id, tick, fontSize, fill]);

  if (error) {
    return (
      <pre className="mermaid-error" style={{ fontSize: 12, color: "var(--fg-alternative)" }}>
        {code}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-figure"
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "32px auto",
        padding: "8px 0",
        overflowX: "auto",
      }}
    />
  );
}
