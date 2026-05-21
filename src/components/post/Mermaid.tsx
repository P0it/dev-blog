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

function buildConfig(t: Tokens) {
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
      padding: 24,
      nodeSpacing: 50,
      rankSpacing: 60,
      useMaxWidth: true,
      htmlLabels: true, // 한글 너비 정확히 잡으려면 HTML 라벨 필수
    },
    sequence: { useMaxWidth: true, mirrorActors: false, actorFontFamily: fontFamily, noteFontFamily: fontFamily, messageFontFamily: fontFamily },
    themeVariables: {
      fontFamily,
      fontSize: "14px",
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

export function Mermaid({ code }: { code: string }) {
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
        mermaid.initialize(buildConfig(readTokens()));
        const { svg } = await mermaid.render(`m-${id}-${tick}`, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id, tick]);

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
        margin: "32px 0",
        padding: "8px 0",
        overflowX: "auto",
      }}
    />
  );
}
