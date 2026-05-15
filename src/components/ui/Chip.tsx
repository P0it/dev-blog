import type { ChipVariant } from "@/lib/types";

const variantClass: Record<ChipVariant, string> = {
  default: "chip",
  blue: "chip chip-blue",
  purple: "chip chip-purple",
  green: "chip chip-green",
  outline: "chip chip-outline",
};

export function Chip({
  variant = "default",
  children,
  className = "",
}: {
  variant?: ChipVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`${variantClass[variant]} ${className}`}>{children}</span>;
}
