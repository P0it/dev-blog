export type Shot = { title: string; src: string; caption: string };

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 화면 갤러리. 정지 화면을 그리드로 늘어놓아 "이게 뭐 하는 물건인지"를 먼저 보여준다.
// 시연(`## 시연`)은 흐름을 끝까지 따라가는 큰 클립이고, 여기는 장면 한 컷씩이다.
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
          <figcaption className="lab-shot-cap">
            <strong>{s.title}</strong>
            {s.caption && <p>{s.caption}</p>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
