import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  value: number;
  size?: ProgressSize;
  showLabel?: boolean;
  className?: string;
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: "h-2",
  md: "h-4",
  lg: "h-6",
};

const labelSizeStyles: Record<ProgressSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export function ProgressBar({
  value,
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        // Base container styles
        "relative w-full bg-[#e2e8f0] rounded-full overflow-hidden",
        sizeStyles[size],
        className
      )}
    >
      {/* Progress fill */}
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${clampedValue}%` } as CSSProperties}
      />
      
      {/* Label */}
      {showLabel && size !== "sm" && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "font-semibold text-text",
            labelSizeStyles[size]
          )}
        >
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
