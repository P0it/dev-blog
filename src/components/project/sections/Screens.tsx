export type Shot = { title: string; src: string; caption: string };

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 화면 갤러리 — 폰 모양 판을 좌우로 쭉 깔아 훑게 한다.
// 화면마다 설명을 달지 않는다. 무엇이 어떻게 돌아가는지는 `## 개발 과정` 이 이야기하고,
// 여기는 "이렇게 생겼다"만 보여주는 자리다. 이름표만 작게 붙인다.
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
          {s.title && <figcaption className="lab-shot-cap">{s.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
