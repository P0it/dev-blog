// 인터뷰 — 만든 사람에게 묻는다. 왜 시작했고, 누가 쓰고, 만들고 나서 어땠는지.
//
// 예전 이름은 `## 기획` 이었는데, 하는 일이 문답이라 이름과 내용이 어긋났다.
// 판단(어디까지 하기로 했나·무엇을 접었나)은 `## 개발 과정` 이 이야기로 맡는다 —
// 규약에서 `## 기획` 섹션 자체를 없앴다. Plan.tsx 는 옛 원고용으로만 남아 있다.
//
// 라벨을 그대로 표로 세우면 이력서처럼 읽힌다. 라벨을 질문으로 바꿔 인터뷰처럼
// 주고받게 한다. 원고는 그대로 `**라벨** 값` 이고, 질문은 여기서만 붙인다 —
// 규약을 건드리지 않으면서 화면만 바뀐다.
// 톤은 인터뷰어다. 캐묻지 않고 물어본다.
// "뭐가 그렇게 불편했는데요?" 처럼 따지는 말투는 답을 변명처럼 만든다.
const QUESTION: Record<string, string> = {
  // 표지에는 이제 소개 문단이 없다. 이 물건이 뭔지는 여기 첫 문답이 말한다.
  소개: "어떤 서비스인가요?",
  "한 줄 소개": "어떤 서비스인가요?",

  // 시작
  계기: "어떤 계기로 만들게 됐나요?",
  동기: "어떤 계기로 만들게 됐나요?",
  문제: "어떤 계기로 만들게 됐나요?",
  이름: "이름은 어떻게 지었나요?",
  벤치마크: "참고한 서비스가 있었나요?",
  차별점: "이미 있는 것들과 뭐가 다른가요?",

  // 누가 · 어떻게 만들었나
  사용자: "주로 어떤 분이 쓰나요?",
  팀: "혼자 만드셨나요?",
  기간: "만드는 데 얼마나 걸렸나요?",
  비용: "운영비는 얼마나 드나요?",

  // 판단을 적는 라벨(범위·제약·정책 …)은 여기 없다. 문답이 아니라 결정이라
  // `## 개발 과정` 이 이야기로 푼다.

  // 만들고 나서
  자랑: "제일 마음에 드는 부분은 어디인가요?",
  반응: "써 본 사람들 반응은 어땠나요?",
  "배운 것": "만들면서 배운 게 있다면요?",
  지금: "지금도 쓰고 계신가요?",
};

// 파서는 같은 **라벨**끼리 묶지만, 다른 라벨이 같은 질문으로 뜨는 경우가 있다
// (`문제`·`동기`·`계기` → "어떤 계기로 만들게 됐나요?"). 그대로 그리면 같은 질문이
// 두 번 서서 인터뷰가 도돌이표로 읽히므로, 화면에서 한 번 더 **질문 기준**으로 묶는다.
function byQuestion(fields: { label: string; values: string[] }[]) {
  const out: { question: string; values: string[] }[] = [];
  for (const f of fields) {
    const question = QUESTION[f.label] ?? f.label;
    const hit = out.find((o) => o.question === question);
    if (hit) hit.values.push(...f.values);
    else out.push({ question, values: [...f.values] });
  }
  return out;
}

export function Interview({ fields }: { fields: { label: string; values: string[] }[] }) {
  return (
    <div className="lab-qa lab-reveal">
      {byQuestion(fields).map((f, i) => (
        <div key={i} className="lab-qa-row">
          <p className="lab-qa-q">
            <span className="mark" aria-hidden>
              Q
            </span>
            {/* 모르는 라벨은 물음을 지어내지 않는다. 라벨을 그대로 세운다. */}
            {f.question}
          </p>
          <div className="lab-qa-a">
            {f.values.map((v, j) => (
              <p key={j}>{v}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
