// 기획 — 만들기 전에 내린 판단. 어디까지만 풀기로 했고, 무엇을 먼저 놓았고,
// 검토했다 접은 안은 무엇이고, 어떤 규칙으로 돌리기로 했는지.
//
// 예전에는 이 제목이 만든 사람 문답을 달고 있었다. 이름만 기획이고 내용은
// 소개·계기·사용자라 정작 기획이 빠져 있었다. 문답은 `## 인터뷰`(Interview.tsx)로
// 떼어 내고, 이 자리는 판단만 남겼다.
//
// 그래서 화면도 문답이 아니다. 질문을 지어 붙이면 판단이 변명처럼 읽힌다.
// 라벨을 그대로 세운 표다 — 결정 항목과 그 내용이 짝지어 보이는 편이,
// 읽는 사람이 "이 사람이 무엇을 잘랐나"를 훑기에 낫다.
export function Plan({ fields }: { fields: { label: string; values: string[] }[] }) {
  return (
    <dl className="lab-plan lab-reveal">
      {fields.map((f, i) => (
        <div key={i} className="lab-plan-row">
          <dt>{f.label}</dt>
          <dd>
            {/* 같은 라벨이 여럿이면 값만 아래로 쌓는다 — 접은 안이 셋일 수 있다 */}
            {f.values.map((v, j) => (
              <p key={j}>{v}</p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
