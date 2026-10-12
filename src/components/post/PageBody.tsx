"use client";

import { useEffect, useMemo, useRef } from "react";

// HTML 페이지형 글의 본문. HTML 은 서버 렌더에 그대로 실려 검색엔진이 읽는다.
//
// 글 안의 <script> 는 서버 HTML 에서는 type 을 바꿔 잠가 둔다. 그대로 두면 브라우저가
// 문서를 읽는 순간 실행해 버려, 아래 postPage 가 준비되기 전에 돈다. 마운트 뒤
// 잠근 스크립트마다 실행용 사본을 붙여 순서대로 돌리고, 언마운트 때 사본을 걷는다.
//
// 글 스크립트가 쓸 수 있도록 window.postPage = { root, signal } 을 열어 둔다.
// 다른 글로 넘어가면 signal 이 abort 되므로, 글 스크립트는 addEventListener(…, { signal })
// 로 붙여야 리스너가 다음 화면에 남지 않는다.
declare global {
  interface Window {
    postPage?: { root: HTMLElement; signal: AbortSignal };
  }
}

const INERT = "text/post-page";

function lockScripts(html: string): string {
  return html.replace(/<script\b([^>]*)>/gi, (_m, attrs: string) => {
    const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1];
    const rest = attrs.replace(/\stype\s*=\s*(["'][^"']*["']|[^\s>]+)/i, "");
    return `<script type="${INERT}"${type ? ` data-type="${type}"` : ""}${rest}>`;
  });
}

export function PageBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const locked = useMemo(() => lockScripts(html), [html]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctrl = new AbortController();
    const added: HTMLScriptElement[] = [];
    window.postPage = { root, signal: ctrl.signal };

    // src 스크립트(라이브러리)가 다 받아진 뒤에 다음 인라인 스크립트가 돌도록 하나씩 실행.
    const scripts = Array.from(root.querySelectorAll<HTMLScriptElement>(`script[type="${INERT}"]`));
    (async () => {
      for (const old of scripts) {
        if (ctrl.signal.aborted) return;
        const s = document.createElement("script");
        for (const { name, value } of Array.from(old.attributes)) {
          if (name !== "type" && name !== "data-type") s.setAttribute(name, value);
        }
        if (old.dataset.type) s.type = old.dataset.type;
        added.push(s);
        if (old.src) {
          await new Promise<void>((resolve) => {
            s.onload = s.onerror = () => resolve();
            old.after(s);
          });
        } else {
          s.textContent = old.textContent;
          old.after(s);
        }
      }
    })();

    return () => {
      ctrl.abort();
      added.forEach((s) => s.remove());
      if (window.postPage?.root === root) delete window.postPage;
    };
  }, [locked]);

  return <div ref={ref} className="post-page" dangerouslySetInnerHTML={{ __html: locked }} />;
}
