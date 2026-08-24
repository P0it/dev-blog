// 기획 — 누구의 어떤 문제를, 어디까지 풀기로 했는지.
//
// 라벨을 그대로 표로 세우면 이력서처럼 읽힌다. 라벨을 질문으로 바꿔 인터뷰처럼
// 주고받게 한다. 원고는 그대로 `**라벨** 값` 이고, 질문은 여기서만 붙인다 —
// 규약을 건드리지 않으면서 화면만 바뀐다.
// 톤은 인터뷰어다. 캐묻지 않고 물어본다.
// "뭐가 그렇게 불편했는데요?" 처럼 따지는 말투는 답을 변명처럼 만든다.
const QUESTION: Record<string, string> = {
  계기: "만들게 된 계기가 궁금합니다.",
  동기: "만들게 된 계기가 궁금합니다.",
  벤치마크: "참고한 서비스가 있었나요?",
  문제: "어떤 불편에서 출발했나요?",
  사용자: "주로 어떤 분이 쓰나요?",
  가설: "될 거라고 본 근거가 있었나요?",
  제약: "작업하면서 어떤 제약이 있었나요?",
  "성공 기준": "어디까지 되면 성공이라고 봤나요?",
  기간: "기간은 얼마나 걸렸나요?",
  "넣지 않은 것": "일부러 넣지 않은 것도 있나요?",
};

export function Plan({ fields }: { fields: { label: string; values: string[] }[] }) {
  return (
    <div className="lab-qa lab-reveal">
      {fields.map((f, i) => (
        <div key={i} className="lab-qa-row">
          <p className="lab-qa-q">
            <span className="mark" aria-hidden>
              Q
            </span>
            {/* 모르는 라벨은 물음을 지어내지 않는다. 라벨을 그대로 세운다. */}
            {QUESTION[f.label] ?? f.label}
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
