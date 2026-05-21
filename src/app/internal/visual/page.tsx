import type { Metadata } from "next";
import type { VisualSpec } from "@/components/visuals/types";
import { VisualRenderer } from "@/components/visuals/registry";

// 개발용 미리보기 — 본문 ```visual 블록이 렌더되는 카탈로그 패턴을
// 라이트/다크로 한자리에서 점검한다. 검색 노출 대상이 아니다.
export const metadata: Metadata = {
  title: "시각자료 카탈로그 — 패턴 미리보기",
  robots: { index: false, follow: false },
};

const SPECS: { id: string; note: string; spec: VisualSpec }[] = [
  {
    id: "step-card",
    note: "번호가 의미 있는 절차·파이프라인",
    spec: {
      pattern: "step-card",
      alt: "에이전트 루프 5단계",
      title: "Claude Code는 에이전트 루프로 작동합니다",
      accent: "primary",
      steps: [
        { label: "사용자 요청", sublabel: "your prompt", icon: "message-circle" },
        { label: "컨텍스트 수집", sublabel: "read · search", icon: "search" },
        { label: "실행", sublabel: "edit · run", icon: "edit" },
        { label: "결과 검증", sublabel: "test · verify", icon: "check" },
        { label: "작업 완료", sublabel: "task done", icon: "check-check" },
      ],
    },
  },
  {
    id: "stat-card",
    note: "1~4개 숫자·지표 강조",
    spec: {
      pattern: "stat-card",
      alt: "주요 벤치마크 지표",
      eyebrow: "성능 지표",
      title: "세대를 거치며 지표가 크게 올랐습니다",
      accent: "success",
      stats: [
        {
          value: "83.1%",
          label: "SWE-bench Verified",
          icon: "bar-chart-3",
          delta: { value: "+12%p", direction: "up" },
        },
        {
          value: "1M",
          label: "컨텍스트 토큰",
          caption: "긴 코드베이스도 한 번에",
          icon: "database",
        },
        {
          value: "2배",
          label: "출력 속도",
          caption: "고속 모드 기준",
          icon: "zap",
        },
      ],
    },
  },
  {
    id: "callout-card",
    note: "한 문장으로 못 박는 결론·경고",
    spec: {
      pattern: "callout-card",
      alt: "핵심 요점",
      accent: "warn",
      icon: "alert-triangle",
      heading: "도구를 늘리기 전에 검증 루프부터 갖추세요",
      body: "에이전트의 신뢰성은 모델 크기가 아니라, 스스로 실수를 발견하고 되돌릴 수 있는 환경에서 나옵니다.",
    },
  },
  {
    id: "compare-card",
    note: "둘·셋을 칼럼으로 나란히 견주기",
    spec: {
      pattern: "compare-card",
      alt: "자동완성과 에이전트 방식 비교",
      eyebrow: "두 가지 접근",
      title: "자동완성과 에이전트는 일하는 방식이 다릅니다",
      accent: "primary",
      columns: [
        {
          label: "자동완성",
          caption: "다음 줄을 제안",
          icon: "type",
          accent: "mute",
          points: [
            "커서 위치의 다음 토큰을 예측",
            "한 번에 몇 줄 단위로 채움",
            "맥락은 열린 파일 범위까지",
          ],
        },
        {
          label: "에이전트",
          caption: "작업을 끝까지 수행",
          icon: "bot",
          accent: "primary",
          points: [
            "목표를 받고 스스로 단계를 계획",
            "파일을 읽고 고치고 실행",
            "결과를 검증하고 반복",
          ],
        },
      ],
    },
  },
  {
    id: "timeline-card",
    note: "날짜가 붙는 시간 순 흐름·연혁",
    spec: {
      pattern: "timeline-card",
      alt: "Claude 모델 주요 출시 연혁",
      eyebrow: "릴리스 히스토리",
      title: "Claude는 빠르게 세대를 거듭했습니다",
      accent: "accent",
      events: [
        {
          date: "2024.03",
          label: "Claude 3 공개",
          description: "Haiku·Sonnet·Opus 3종 라인업",
          icon: "flag",
        },
        {
          date: "2024.06",
          label: "Claude 3.5 Sonnet",
          description: "코딩·추론 성능이 크게 향상",
          icon: "trending-up",
        },
        {
          date: "2025.02",
          label: "Claude Code 출시",
          description: "터미널에서 동작하는 에이전트",
          icon: "terminal",
          accent: "primary",
        },
        {
          date: "2026.01",
          label: "Opus 4.7",
          description: "1M 컨텍스트·고속 모드",
          icon: "rocket",
          accent: "success",
        },
      ],
    },
  },
  {
    id: "quote-card",
    note: "원문·강연의 한 마디를 그대로 인용",
    spec: {
      pattern: "quote-card",
      alt: "에이전트 설계에 대한 인용",
      accent: "primary",
      quote:
        "모델에게 더 많은 맥락을 떠먹여 주는 것보다, 모델이 직접 맥락을 찾아 나서게 하는 편이 거의 항상 낫습니다.",
      attribution: "Claude Code 팀",
      role: "Anthropic",
    },
  },
  {
    id: "checklist-card",
    note: "권장·금지를 표시로 구분",
    spec: {
      pattern: "checklist-card",
      alt: "프롬프트 작성 권장·금지 사항",
      eyebrow: "프롬프트 체크리스트",
      title: "지시는 구체적으로, 맥락은 충분히",
      accent: "primary",
      items: [
        {
          state: "do",
          text: "원하는 결과의 형식을 예시로 보여 준다",
          caption: "출력 예시 한두 개면 충분합니다",
        },
        { state: "do", text: "제약 조건을 지시 맨 앞에 명시한다" },
        { state: "dont", text: "여러 작업을 한 문장에 욱여넣는다" },
        { state: "dont", text: "‘알아서 잘’ 같은 모호한 표현에 맡긴다" },
        { state: "neutral", text: "긴 배경 설명은 별도 문단으로 분리한다" },
      ],
    },
  },
  {
    id: "grid-card",
    note: "순서 없는 구성요소·갈래를 타일로",
    spec: {
      pattern: "grid-card",
      alt: "Claude Code를 이루는 네 가지 요소",
      eyebrow: "구성 요소",
      title: "Claude Code는 네 축으로 작동합니다",
      accent: "primary",
      items: [
        {
          title: "도구",
          icon: "wrench",
          description: "파일 읽기·편집·셸 실행 등 실제 행동",
          accent: "primary",
        },
        {
          title: "컨텍스트",
          icon: "book-open",
          description: "코드베이스와 대화 기록을 읽어 들임",
          accent: "info",
        },
        {
          title: "권한",
          icon: "shield-check",
          description: "민감한 작업은 사용자 승인을 거침",
          accent: "warn",
        },
        {
          title: "메모리",
          icon: "database",
          description: "세션을 넘어 유지되는 프로젝트 지식",
          accent: "accent",
        },
      ],
    },
  },
];

const CSS = `
.pv { max-width: 1080px; margin: 0 auto; padding: 64px 24px 128px; }
.pv-kicker {
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-primary);
}
.pv-h1 {
  font-family: var(--font-display); font-size: 34px; font-weight: 800;
  letter-spacing: -0.03em; color: var(--fg-strong); margin: 12px 0 0;
}
.pv-lead { margin: 12px 0 0; font-size: 15px; line-height: 1.7; color: var(--fg-neutral); }
.pv-lead code {
  font-family: var(--font-mono); font-size: 13px;
  background: var(--bg-muted); padding: 1px 6px; border-radius: 5px;
}
.pv-sec { margin-top: 44px; }
.pv-meta { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.pv-id { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--fg-strong); }
.pv-note { font-size: 13px; color: var(--fg-alternative); }
.pv-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.pv-cell {
  box-sizing: border-box;
  padding: 24px; border-radius: 16px;
  border: 1px solid var(--line-normal);
  background: var(--bg-base);
}
.pv-cell-tag {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--fg-assistive); margin-bottom: 14px;
}
@media (max-width: 860px) { .pv-pair { grid-template-columns: 1fr; } }
`;

export default function VisualCatalogPreview() {
  return (
    <>
      <style>{CSS}</style>
      <main className="pv">
        <header>
          <div className="pv-kicker">DEV · 시각자료 카탈로그</div>
          <h1 className="pv-h1">카탈로그 패턴 미리보기</h1>
          <p className="pv-lead">
            본문 <code>{"```visual"}</code> 블록이 렌더되는 8가지 패턴입니다.
            왼쪽은 현재 사이트 테마, 오른쪽은 다크 고정 — 두 칼럼을 같이 보려면
            사이트를 라이트 모드로 두세요.
          </p>
        </header>
        {SPECS.map(({ id, note, spec }) => (
          <section className="pv-sec" key={id}>
            <div className="pv-meta">
              <span className="pv-id">{id}</span>
              <span className="pv-note">{note}</span>
            </div>
            <div className="pv-pair">
              <div className="pv-cell">
                <div className="pv-cell-tag">현재 테마</div>
                <VisualRenderer spec={spec} />
              </div>
              <div className="pv-cell" data-theme="dark">
                <div className="pv-cell-tag">다크</div>
                <VisualRenderer spec={spec} />
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
