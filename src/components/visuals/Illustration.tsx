/**
 * 개념 일러스트 — LLM 이 작성한 raw SVG 를 그대로 렌더한다.
 * SVG 내용 자체가 디자인이므로 카드 프레임 없이 투명 배경에 둔다.
 * 색은 SVG 안에서 디자인 토큰(var(--...))으로 지정돼 라이트/다크에 대응한다.
 */
export function Illustration({ svg }: { svg: string }) {
  return (
    <div
      className="visual-illus"
      style={{ width: 760 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
