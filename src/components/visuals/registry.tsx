import type { ReactElement } from "react";
import { StepCard } from "./StepCard";
import { StatCard } from "./StatCard";
import { CalloutCard } from "./CalloutCard";
import type { VisualSpec } from "./types";

export const VISUAL_PATTERNS = ["step-card", "stat-card", "callout-card"] as const;
export type VisualPattern = (typeof VISUAL_PATTERNS)[number];

export function isVisualPattern(value: string): value is VisualPattern {
  return (VISUAL_PATTERNS as readonly string[]).includes(value);
}

/** 검증을 통과한 spec 을 패턴에 맞는 카탈로그 컴포넌트로 렌더한다. */
export function VisualRenderer({ spec }: { spec: VisualSpec }): ReactElement {
  switch (spec.pattern) {
    case "step-card":
      return <StepCard spec={spec} />;
    case "stat-card":
      return <StatCard spec={spec} />;
    case "callout-card":
      return <CalloutCard spec={spec} />;
  }
}

/** 카탈로그 인덱스 미리보기용 샘플 데이터. */
export const SAMPLE_SPECS: VisualSpec[] = [
  {
    pattern: "step-card",
    alt: "Claude Code의 에이전트 루프 5단계",
    eyebrow: "HOW CLAUDE CODE WORKS",
    title: "Claude Code는 에이전트 루프로 작동합니다",
    accent: "primary",
    theme: "light",
    direction: "horizontal",
    steps: [
      { label: "사용자 요청", sublabel: "your prompt", icon: "message-circle" },
      { label: "컨텍스트 수집", sublabel: "read · search", icon: "search" },
      { label: "실행", sublabel: "edit · run", icon: "edit" },
      { label: "결과 검증", sublabel: "test · verify", icon: "check" },
      {
        label: "작업 완료",
        sublabel: "task complete",
        icon: "check-check",
        highlight: true,
      },
    ],
  },
  {
    pattern: "stat-card",
    alt: "Mythos Preview 벤치마크 성과",
    eyebrow: "BENCHMARK",
    title: "Mythos Preview가 세운 기록",
    accent: "primary",
    theme: "light",
    stats: [
      {
        value: "83.1%",
        label: "CyberGym 점수",
        caption: "이전 세대 66.6%",
        accent: "primary",
        delta: { value: "+16.5%p", direction: "up" },
      },
      {
        value: "수천 개",
        label: "발견한 고위험 취약점",
        caption: "모두 보고·패치 완료",
        accent: "success",
      },
      {
        value: "1억 달러",
        label: "방어 보안 크레딧",
        caption: "오픈소스 단체 지원",
        accent: "accent",
      },
    ],
  },
  {
    pattern: "callout-card",
    alt: "공격자보다 방어자가 먼저",
    accent: "warn",
    theme: "light",
    icon: "shield-alert",
    heading: "공격자가 먼저 손에 넣기 전에 방어자에게 닿게 한다",
    body: "취약점 발견에서 악용까지 걸리던 시간이 몇 달에서 몇 분으로 무너졌습니다. AI의 발견 능력을 방어자에게 먼저, 더 빨리 전달하는 것이 핵심입니다.",
  },
];
