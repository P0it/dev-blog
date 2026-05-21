/**
 * 개념 일러스트 — LLM 이 작성한 raw SVG 를 본문에 인라인으로 렌더한다.
 * SVG 안에서 색을 디자인 토큰(var(--...))으로 지정하므로 라이트/다크 자동 대응.
 */
export function Illustration({ svg }: { svg: string }) {
  return (
    <div
      className="vis vis-illus"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
