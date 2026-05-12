"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useReviewStore } from "@/store";
import { cn } from "@/lib/utils";

export function AnomalyNavigation() {
  const { currentAnomalyIndex, anomalies } = useReviewStore(
    useShallow((state) => ({
      currentAnomalyIndex: state.currentAnomalyIndex,
      anomalies: state.anomalies,
    }))
  );

  const total = anomalies.length;
  const itemsPerPage = 6;
  const totalPages = Math.ceil(total / itemsPerPage);
  const currentPage = Math.floor(currentAnomalyIndex / itemsPerPage) + 1;

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const goBack = () => {
    if (canGoBack) {
      useReviewStore.setState({ currentAnomalyIndex: (currentPage - 2) * itemsPerPage });
    }
  };

  const goForward = () => {
    if (canGoForward) {
      useReviewStore.setState({ currentAnomalyIndex: currentPage * itemsPerPage });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && canGoBack) goBack();
      else if (e.key === "ArrowRight" && canGoForward) goForward();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGoBack, canGoForward]);

  if (total === 0) return null;

  const navBtn = cn(
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
    "border border-[#ede8e1] bg-white text-[#6b6258]",
    "transition-[background-color,color,opacity] duration-150 ease-out active:scale-[0.97]",
    "disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#f7f5f2] hover:enabled:text-[#1a1612]"
  );

  return (
    <nav className="flex items-center justify-center gap-3">
      <button onClick={goBack} disabled={!canGoBack} className={navBtn} style={{ fontFamily: "var(--font-sans)" }} aria-label="Página anterior">
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Anterior
      </button>

      <span className="text-xs font-medium text-[#6b6258] tabular-nums" style={{ fontFamily: "var(--font-sans)" }}>
        {currentPage} / {totalPages}
      </span>

      <button onClick={goForward} disabled={!canGoForward} className={navBtn} style={{ fontFamily: "var(--font-sans)" }} aria-label="Siguiente página">
        Siguiente
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </nav>
  );
}
