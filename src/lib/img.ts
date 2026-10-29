// Supabase Storage 이미지를 Next 이미지 최적화(/_next/image)로 돌려 보낸다.
// 브라우저가 Storage 원본을 직접 받으면 파일 크기만큼 Supabase egress 로 잡힌다.
// 최적화 경로를 거치면 Vercel 이 변환본을 캐시해 두고, Supabase 는 처음 한 번만 읽힌다.
//
// 변환 폭은 next.config.ts 의 images.deviceSizes 안에 있어야 한다(아니면 400).
const WIDTHS = [640, 1080, 1920];
const QUALITY = 75;

const STORAGE = /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//;
// 애니메이션·벡터·영상은 변환하면 깨지거나 의미가 없어 원본 그대로 둔다.
const PASSTHROUGH = /\.(gif|svg|mp4|webm|mov)(\?|$)/i;

export function isOptimizable(src: string | null | undefined): src is string {
  return !!src && STORAGE.test(src) && !PASSTHROUGH.test(src);
}

export function optimizedUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;
}

export function imageProps(
  src: string,
  sizes = "100vw",
): { src: string; srcSet?: string; sizes?: string } {
  if (!isOptimizable(src)) return { src };
  return {
    src: optimizedUrl(src, 1080),
    srcSet: WIDTHS.map((w) => `${optimizedUrl(src, w)} ${w}w`).join(", "),
    sizes,
  };
}

// HTML 페이지형 글 본문의 <img> 를 같은 방식으로 바꾼다. 글 HTML 은 DB 에 그대로 두고 렌더 때만 고친다.
// 이미 srcset 이 있거나 Storage 가 아닌 이미지는 건드리지 않는다.
export function optimizeHtmlImages(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (m, raw: string) => {
    const attrs = raw.replace(/\/\s*$/, "");
    if (/\ssrcset\s*=/i.test(attrs)) return m;
    const src = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    const url = src?.[1] ?? src?.[2];
    if (!src || !isOptimizable(url)) return m;
    const p = imageProps(url, "(min-width: 1080px) 1080px, 100vw");
    const esc = (s: string) => s.replace(/&/g, "&amp;");
    const rest = attrs.replace(src[0], "");
    const lazy = /\sloading\s*=/i.test(rest) ? "" : ' loading="lazy"';
    return `<img${rest} src="${esc(p.src)}" srcset="${esc(p.srcSet!)}" sizes="${p.sizes}"${lazy}>`;
  });
}
