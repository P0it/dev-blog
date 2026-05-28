import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** "message-circle" → "MessageCircle" */
function toPascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
}

/**
 * 이름(kebab-case)으로 Lucide 아이콘 컴포넌트를 찾는다.
 * 1) icons 맵(정식 이름) → 2) named export(별칭, 예: edit→SquarePen) → 3) Circle 폴백.
 */
function resolveIcon(name: string): LucideIcon {
  const pascal = toPascal(name);
  const canonical = Lucide.icons[pascal as keyof typeof Lucide.icons];
  if (canonical) return canonical;

  const aliased = (Lucide as Record<string, unknown>)[pascal];
  if (aliased && (typeof aliased === "function" || typeof aliased === "object")) {
    return aliased as LucideIcon;
  }
  return Lucide.icons.Circle;
}

type VisualIconProps = {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function VisualIcon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 2,
}: VisualIconProps) {
  // Lucide 아이콘 이름은 항상 ASCII kebab-case. 그 밖(이모지 등)은 글리프로 그대로 렌더한다
  // — 폰트 스택 끝의 Tossface가 컬러 이모지로 받는다. Circle 폴백으로 떨어지지 않게 분기.
  if (!/^[a-z0-9-]+$/i.test(name)) {
    return (
      <span className="vis-emoji" style={{ fontSize: size, lineHeight: 1 }}>
        {name}
      </span>
    );
  }
  const Cmp = resolveIcon(name);
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
