import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#f1f5f9] text-[#64748b]",
  success: "bg-[#d1fae5] text-[#059669]",
  warning: "bg-[#fef3c7] text-[#d97706]",
  error:   "bg-[#fee2e2] text-[#dc2626]",
  info:    "bg-[#dbeafe] text-[#1d4ed8]",
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5",
        "text-xs font-semibold rounded-full",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
