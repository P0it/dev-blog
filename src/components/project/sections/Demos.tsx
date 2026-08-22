"use client";

import { useEffect, useRef, useState } from "react";

export type Clip = {
  title: string;
  src: string;
  poster: string | null;
  caption: string;
};

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 화면에 들어왔을 때만 재생한다. 여러 클립이 동시에 도는 걸 막고,
// 보이지도 않는 영상을 내려받지 않게 한다.
function Player({ clip }: { clip: Clip }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <video
      ref={ref}
      src={clip.src}
      poster={clip.poster ?? undefined}
      muted
      loop
      playsInline
      controls
      preload="metadata"
    />
  );
}

export function Demos({ clips }: { clips: Clip[] }) {
  return (
    <div className="lab-demo">
      {clips.map((c, i) => (
        <figure key={i} className="lab-panel lab-corner lab-demo-item">
          <div className="lab-demo-frame">
            {VIDEO.test(c.src) ? (
              <Player clip={c} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.src} alt={c.title} />
            )}
          </div>
          <figcaption className="lab-demo-cap">
            <span className="lab-label">
              scene {String(i + 1).padStart(2, "0")}
            </span>
            <strong>{c.title}</strong>
            {c.caption && <p>{c.caption}</p>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
