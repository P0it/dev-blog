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
  accent: accentSchema.optional(),
});

export const stepCardSchema = z.object({
  pattern: z.literal("step-card"),
  ...baseFields,
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

/* ---------- compare-card ---------- */

const compareColumnSchema = z.object({
  label: z.string().min(1).max(28),
  caption: z.string().max(40).optional(),
  icon: z.string().min(1).optional(),
  accent: accentSchema.optional(),
  points: z.array(z.string().min(1).max(70)).min(1).max(6),
});

export const compareCardSchema = z.object({
  pattern: z.literal("compare-card"),
  ...baseFields,
  columns: z.array(compareColumnSchema).min(2).max(3),
});

/* ---------- timeline-card ---------- */

const timelineEventSchema = z.object({
  date: z.string().min(1).max(20),
  label: z.string().min(1).max(40),
  description: z.string().max(96).optional(),
  icon: z.string().min(1).optional(),
  accent: accentSchema.optional(),
});

export const timelineCardSchema = z.object({
  pattern: z.literal("timeline-card"),
  ...baseFields,
  events: z.array(timelineEventSchema).min(2).max(6),
});

/* ---------- quote-card ---------- */

export const quoteCardSchema = z.object({
  pattern: z.literal("quote-card"),
  ...baseFields,
  quote: z.string().min(1).max(220),
  attribution: z.string().max(40).optional(),
  role: z.string().max(48).optional(),
});

/* ---------- checklist-card ---------- */

const checkItemSchema = z.object({
  text: z.string().min(1).max(80),
  state: z.enum(["do", "dont", "neutral"]).default("do"),
  caption: z.string().max(80).optional(),
});

export const checklistCardSchema = z.object({
  pattern: z.literal("checklist-card"),
  ...baseFields,
  items: z.array(checkItemSchema).min(2).max(8),
});

/* ---------- grid-card ---------- */

const gridItemSchema = z.object({
  title: z.string().min(1).max(28),
  description: z.string().max(96).optional(),
  icon: z.string().min(1),
  accent: accentSchema.optional(),
});

export const gridCardSchema = z.object({
  pattern: z.literal("grid-card"),
  ...baseFields,
  items: z.array(gridItemSchema).min(2).max(6),
});

/* ---------- list-card ---------- */

const listItemSchema = z.object({
  label: z.string().min(1).max(48),
  description: z.string().max(140).optional(),
});

export const listCardSchema = z.object({
  pattern: z.literal("list-card"),
  ...baseFields,
  items: z.array(listItemSchema).min(2).max(8),
});

/* ---------- bullet-card ---------- */

export const bulletCardSchema = z.object({
  pattern: z.literal("bullet-card"),
  ...baseFields,
  items: z.array(z.string().min(1).max(60)).min(2).max(8),
});

/* ---------- union ---------- */

export const visualSchema = z.discriminatedUnion("pattern", [
  stepCardSchema,
  statCardSchema,
  calloutCardSchema,
  compareCardSchema,
  timelineCardSchema,
  quoteCardSchema,
  checklistCardSchema,
  gridCardSchema,
  listCardSchema,
  bulletCardSchema,
]);

export type VisualSpec = z.infer<typeof visualSchema>;
export type StepCardSpec = z.infer<typeof stepCardSchema>;
export type StatCardSpec = z.infer<typeof statCardSchema>;
export type CalloutCardSpec = z.infer<typeof calloutCardSchema>;
export type CompareCardSpec = z.infer<typeof compareCardSchema>;
export type TimelineCardSpec = z.infer<typeof timelineCardSchema>;
export type QuoteCardSpec = z.infer<typeof quoteCardSchema>;
export type ChecklistCardSpec = z.infer<typeof checklistCardSchema>;
export type GridCardSpec = z.infer<typeof gridCardSchema>;
export type StepSpec = z.infer<typeof stepSchema>;
export type StatSpec = z.infer<typeof statSchema>;
export type DeltaSpec = z.infer<typeof deltaSchema>;
export type CompareColumnSpec = z.infer<typeof compareColumnSchema>;
export type TimelineEventSpec = z.infer<typeof timelineEventSchema>;
export type CheckItemSpec = z.infer<typeof checkItemSchema>;
export type GridItemSpec = z.infer<typeof gridItemSchema>;
export type ListCardSpec = z.infer<typeof listCardSchema>;
export type ListItemSpec = z.infer<typeof listItemSchema>;
export type BulletCardSpec = z.infer<typeof bulletCardSchema>;

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
