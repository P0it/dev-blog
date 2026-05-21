import type { ReactElement } from "react";
import { StepCard } from "./StepCard";
import { StatCard } from "./StatCard";
import { CalloutCard } from "./CalloutCard";
import { visualSchema, type VisualSpec } from "./types";

/** 검증을 통과한 spec 을 패턴에 맞는 카탈로그 컴포넌트로 렌더. */
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

/** ```visual 블록(JSON 문자열)을 검증해 카탈로그 컴포넌트로 렌더. */
export function CatalogVisual({ json }: { json: string }) {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return <div className="vis vis-error">시각자료 JSON 파싱 실패</div>;
  }
  const result = visualSchema.safeParse(data);
  if (!result.success) {
    return (
      <div className="vis vis-error">
        시각자료 검증 실패: {result.error.issues[0]?.message}
      </div>
    );
  }
  return <VisualRenderer spec={result.data} />;
}
