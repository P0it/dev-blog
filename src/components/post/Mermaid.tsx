"use client";

import { useEffect, useId, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      const dark =
        typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "dark";
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? "dark" : "neutral",
        securityLevel: "strict",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

export function Mermaid({ code }: { code: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(`m-${id}`, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

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
        margin: "28px 0",
        padding: "20px",
        background: "var(--bg-subtle)",
        border: "1px solid var(--line-subtle)",
        borderRadius: 12,
        overflowX: "auto",
      }}
    />
  );
}
