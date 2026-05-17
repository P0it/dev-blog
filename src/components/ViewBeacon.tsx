"use client";

import { useEffect, useRef } from "react";

export function ViewBeacon({ path, slug }: { path: string; slug?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ path, slug });
    // sendBeacon은 페이지 이탈에도 안전. 실패 시 fetch 폴백.
    try {
      const ok =
        typeof navigator !== "undefined" &&
        navigator.sendBeacon?.("/api/view", new Blob([payload], { type: "application/json" }));
      if (!ok) {
        fetch("/api/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      /* 집계 실패는 무시 */
    }
  }, [path, slug]);
  return null;
}
