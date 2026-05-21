import { z } from "zod";

/** 카탈로그 공통 강조 색 — globals.css 의 --diag-* 토큰과 1:1 매핑된다. */
export const ACCENTS = [
  "primary",
  "accent",
  "info",
  "success",
  "warn",
  "danger",
  "mute",
] as const;

export const accentSchema = z.enum(ACCENTS);
export type Accent = (typeof ACCENTS)[number];

/** 워커가 라이트·다크 두 벌을 굽는다 — spec 에는 theme 을 적지 않는다. */
export type Theme = "light" | "dark";

const baseFields = {
  alt: z.string().min(1),
  eyebrow: z.string().max(60).optional(),
  title: z.string().max(80).optional(),
  accent: accentSchema.default("primary"),
};

/* ---------- step-card ---------- */

const stepSchema = z.object({
  label: z.string().min(1).max(24),
  sublabel: z.string().max(28).optional(),
  icon: z.string().min(1),
  highlight: z.boolean().optional(),
  accent: accentSchema.optional(),
});

export const stepCardSchema = z.object({
  pattern: z.literal("step-card"),
  ...baseFields,
  direction: z.enum(["horizontal", "vertical"]).default("horizontal"),
  steps: z.array(stepSchema).min(2).max(8),
});

/* ---------- stat-card ---------- */

const deltaSchema = z.object({
  value: z.string().min(1).max(16),
  direction: z.enum(["up", "down", "flat"]),
});

const statSchema = z.object({
  value: z.string().min(1).max(16),
  label: z.string().min(1).max(20),
  caption: z.string().max(28).optional(),
  icon: z.string().min(1).optional(),
  accent: accentSchema.optional(),
  delta: deltaSchema.optional(),
});

export const statCardSchema = z.object({
  pattern: z.literal("stat-card"),
  ...baseFields,
  stats: z.array(statSchema).min(1).max(4),
});

/* ---------- callout-card ---------- */

export const calloutCardSchema = z.object({
  pattern: z.literal("callout-card"),
  ...baseFields,
  icon: z.string().min(1),
  heading: z.string().min(1).max(48),
  body: z.string().max(160).optional(),
});

/* ---------- union ---------- */

export const visualSchema = z.discriminatedUnion("pattern", [
  stepCardSchema,
  statCardSchema,
  calloutCardSchema,
]);

export type VisualSpec = z.infer<typeof visualSchema>;
export type StepCardSpec = z.infer<typeof stepCardSchema>;
export type StatCardSpec = z.infer<typeof statCardSchema>;
export type CalloutCardSpec = z.infer<typeof calloutCardSchema>;
export type StepSpec = z.infer<typeof stepSchema>;
export type StatSpec = z.infer<typeof statSchema>;
export type DeltaSpec = z.infer<typeof deltaSchema>;

/**
 * accent → CSS 변수 페어. fill 은 옅은 배경, strong 은 진한 전경/테두리.
 * 값은 globals.css :root / [data-theme="dark"] 에서 라이트·다크 자동 대응된다.
 */
export const ACCENT_TOKENS: Record<Accent, { fill: string; strong: string }> = {
  primary: { fill: "var(--diag-blue-fill)", strong: "var(--diag-blue-stroke)" },
  accent: { fill: "var(--diag-purple-fill)", strong: "var(--diag-purple-stroke)" },
  info: { fill: "var(--diag-teal-fill)", strong: "var(--diag-teal-stroke)" },
  success: { fill: "var(--diag-green-fill)", strong: "var(--diag-green-stroke)" },
  warn: { fill: "var(--diag-yellow-fill)", strong: "var(--diag-yellow-stroke)" },
  danger: { fill: "var(--diag-red-fill)", strong: "var(--diag-red-stroke)" },
  mute: { fill: "var(--diag-mute-fill)", strong: "var(--diag-mute-stroke)" },
};
