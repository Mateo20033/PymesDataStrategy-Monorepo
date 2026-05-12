import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: ReactNode;
  hoverable?: boolean;
}

export function Card({ className, children, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        "bg-white rounded-[10px]",
        "shadow-[0_1px_3px_rgba(0,0,0,.08),0_4px_16px_rgba(0,0,0,.04)]",
        // Hover effect (optional)
        hoverable && [
          "transition-all duration-150",
          "hover:shadow-[0_4px_6px_rgba(0,0,0,.07),0_10px_30px_rgba(0,0,0,.06)]",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
