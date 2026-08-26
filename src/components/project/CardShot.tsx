import type { ProjectPlatform } from "@/lib/types";

// 판은 상세 갤러리와 같은 비율로 선다.
//  - 폰: 실기기(390×844). 근사치로 두면 캡처 밑동(탭 바)이 잘린다
//  - 웹: 브라우저 창(16:10). 데스크탑 캡처를 폰 판에 넣으면 좌우가 잘려 안 읽힌다
const PHONE_AR = 390 / 844;
const BROWSER_AR = 16 / 10;

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 목록 카드의 대표 화면. **움직이지 않는다** — 긴 캡처도 맨 위만 잘라 세운다.
//
// 한때는 판 안에서 그림을 천천히 훑어 내렸다. 잘라 두면 맨 위 한 뼘만 보여서
// 목록에서 뭐가 뭔지 모른다고 봤기 때문이다. 접었다. 카드 넷이 제각기 다른 속도로
// 흐르니 목록이 가만히 있질 않고, 무엇을 봐야 할지는 오히려 더 흐려졌다.
// 어차피 카드 하나가 답해야 하는 건 "이게 어떻게 생긴 물건인가" 한 가지고,
// 그건 화면 맨 위 한 판이면 대개 말이 된다. 나머지는 상세에서 본다.
//
// 그림 비율을 잴 일이 없어졌으므로 이 조각은 서버에서 그린다.
export function CardShot({
  src,
  platform = "mobile",
}: {
  src: string;
  platform?: ProjectPlatform;
}) {
  // 판 비율은 폰이냐 브라우저냐로 갈린다. CSS 한 곳에서 못박으면 웹 프로젝트가
  // 폰 판에 갇히므로, 렌더러가 값을 넣어 준다.
  const style = {
    ["--shot-ar"]: String(platform === "web" ? BROWSER_AR : PHONE_AR),
  } as React.CSSProperties;

  return (
    <div className="lab-card-shot" style={style}>
      {VIDEO.test(src) ? (
        // 화면 첫 장이 영상인 프로젝트. 규약상 홈 화면이 맨 앞이고, 홈이 움직이는
        // 물건이면 그 자리에 mp4 가 온다. 그렇다고 카드에서 재생하지는 않는다 —
        // 목록이 가만히 있어야 한다는 이유는 긴 캡처를 훑어 내리기를 접은 것과 같다.
        // 그래서 **첫 프레임만 정지 그림처럼** 세운다. 미디어 프래그먼트(`#t=0.001`)를
        // 붙이는 건 브라우저가 메타데이터만 받고 검은 판을 내미는 걸 막기 위해서다.
        // 그 지점으로 탐색하면서 실제 프레임을 한 장 그린다.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={`${src}#t=0.001`}
          preload="metadata"
          muted
          playsInline
          // 재생 제어를 아무것도 걸지 않는다. autoPlay·loop 를 붙이면 카드가 움직인다.
          tabIndex={-1}
          aria-hidden
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" />
      )}
    </div>
  );
}
