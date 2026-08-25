/**
 * 구조화 데이터를 <script type="application/ld+json"> 으로 심는다.
 * data 는 객체 하나 또는 배열. `<` 를 이스케이프해 스크립트 조기 종료를 막는다.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
