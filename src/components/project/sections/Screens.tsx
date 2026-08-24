export type Shot = { title: string; src: string; caption: string };

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 화면 갤러리 — 폰 모양 판을 깔아 "이렇게 생겼다"를 먼저 보여준다.
// 판만 늘어놓으면 목업 전시가 되니, 이름표 아래에 그 화면이 무엇을 하는 자리인지
// 한 줄을 붙인다. 자세한 이야기는 여전히 `## 개발 과정` 이 맡는다.
export function Screens({ shots }: { shots: Shot[] }) {
  return (
    <div className="lab-screens lab-stagger">
      {shots.map((s, i) => (
        <figure key={i} className="lab-shot">
          <div className="lab-shot-frame">
            {VIDEO.test(s.src) ? (
              <video src={s.src} muted loop autoPlay playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.src} alt={s.title} loading="lazy" />
            )}
          </div>
          {(s.title || s.caption) && (
            <figcaption className="lab-shot-cap">
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
              {s.caption && <p className="lab-shot-desc">{s.caption}</p>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
