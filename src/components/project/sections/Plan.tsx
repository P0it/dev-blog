// 기획 — 누구의 어떤 문제를, 어디까지 풀기로 했는지.
//
// 라벨을 그대로 표로 세우면 이력서처럼 읽힌다. 라벨을 질문으로 바꿔 인터뷰처럼
// 주고받게 한다. 원고는 그대로 `**라벨** 값` 이고, 질문은 여기서만 붙인다 —
// 규약을 건드리지 않으면서 화면만 바뀐다.
const QUESTION: Record<string, string> = {
  계기: "어쩌다 만들 생각을 했어요?",
  동기: "어쩌다 만들 생각을 했어요?",
  벤치마크: "참고한 게 있어요?",
  문제: "뭐가 그렇게 불편했는데요?",
  사용자: "누가 쓰나요?",
  가설: "될 거라고 본 근거는요?",
  제약: "어떤 제약이 있었어요?",
  "성공 기준": "어떻게 되면 성공이라고 봤어요?",
  기간: "얼마나 걸렸어요?",
  "넣지 않은 것": "일부러 안 넣은 건요?",
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
