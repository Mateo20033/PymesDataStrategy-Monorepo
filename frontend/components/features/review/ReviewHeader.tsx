"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useReviewStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Dataset } from "@/types";

interface ReviewHeaderProps {
  dataset: Dataset;
  onSubmit: () => void | Promise<void>;
}

export function ReviewHeader({ dataset, onSubmit }: ReviewHeaderProps) {
  const router = useRouter();

  const { getProgress, isSubmitting } = useReviewStore(
    useShallow((state) => ({
      getProgress: state.getProgress,
      isSubmitting: state.isSubmitting,
    }))
  );

  const progress = getProgress();
  const allResolved = progress.resolved === progress.total && progress.total > 0;

  return (
    <header className="bg-white border-b border-[#ede8e1] px-6 py-4">
      <div className="flex items-center justify-between gap-4">

        {/* Left: back + dataset name */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
              "text-[#6b6258] bg-[#f7f5f2] hover:bg-[#ede8e1] hover:text-[#1a1612]",
              "transition-[background-color,color] duration-150 ease-out active:scale-[0.97]"
            )}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Volver
          </button>
          <h1
            className="text-[#1a1612] font-semibold text-sm truncate"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {dataset.name}
          </h1>
        </div>

        {/* Right: progress + submit */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-xs font-medium text-[#6b6258]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {progress.resolved} de {progress.total} anomalías resueltas
            </span>
            <div className="w-40">
              <ProgressBar value={progress.percentage} size="sm" />
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={!allResolved || isSubmitting}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
              "transition-[background-color,opacity,transform] duration-150 ease-out active:scale-[0.97]",
              allResolved && !isSubmitting
                ? "bg-[#ff6600] text-white hover:bg-[#e55a00]"
                : "bg-[#f7f5f2] text-[#9c9189] cursor-not-allowed"
            )}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              "Finalizar revisión"
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
