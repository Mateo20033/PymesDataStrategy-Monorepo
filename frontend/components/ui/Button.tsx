"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   "bg-[#ff6600] text-white hover:bg-[#cc5200] hover:shadow-[0_4px_12px_rgba(255,102,0,.3)]",
  secondary: "bg-[#1e293b] text-white hover:bg-[#0f172a]",
  outline:   "bg-transparent text-[#1e293b] border border-[#e2e8f0] hover:bg-[#f8fafc]",
  ghost:     "bg-transparent text-[#1e293b] hover:bg-[#f1f5f9]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-semibold rounded-lg",
        "transition-all duration-150",
        // Active press effect (only when not disabled)
        !isDisabled && "active:scale-[0.98]",
        // Variant styles
        variantStyles[variant],
        // Size styles
        sizeStyles[size],
        // Disabled state
        isDisabled && "opacity-55 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
