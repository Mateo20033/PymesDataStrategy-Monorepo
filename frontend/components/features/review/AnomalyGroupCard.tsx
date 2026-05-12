"use client";

import { useState } from "react";
import { Check, X, Sparkles, CheckCircle2, Eye } from "lucide-react";
import { useReviewStore } from "@/store";
import { REVIEW_ACTION } from "@/types";
import type { Anomaly } from "@/types";
import { AnomalyDetailModal } from "./AnomalyDetailModal";
import { cn } from "@/lib/utils";

interface AnomalyGroup {
  type: string;
  label: string;
  totalRows: number;
  anomalies: Anomaly[];
}

interface Props {
  group: AnomalyGroup;
  datasetId: string;
}

/* Semantic header colors — communicate anomaly category (content, not chrome) */
const TYPE_HEADER_COLORS: Record<string, string> = {
  MISSING_VALUE:               "bg-[#fef3c7] text-[#92400e]",
  WHITESPACE_ONLY:             "bg-[#fef9c3] text-[#854d0e]",
  SUSPICIOUS_PLACEHOLDER:      "bg-[#fef9c3] text-[#854d0e]",
  LEADING_TRAILING_WHITESPACE: "bg-[#fefce8] text-[#713f12]",
  DUPLICATE:                   "bg-[#fee2e2] text-[#991b1b]",
  SEQUENCE_GAP:                "bg-[#fecaca] text-[#991b1b]",
  OUTLIER:                     "bg-[#fff0e6] text-[#c2410c]",
  NUMERIC_ROUND_NUMBER:        "bg-[#ffedd5] text-[#c2410c]",
  LOW_VARIANCE:                "bg-[#fff7ed] text-[#9a3412]",
  OUTLIER_IQR:                 "bg-[#ffedd5] text-[#c2410c]",
  FORMAT_ERROR:                "bg-[#dbeafe] text-[#1e40af]",
  FORMAT_INVALID:              "bg-[#eff6ff] text-[#1d4ed8]",
  DATE_LOGICAL:                "bg-[#e0f2fe] text-[#0369a1]",
  INCONSISTENT:                "bg-[#f3e8ff] text-[#7e22ce]",
  CROSS_FIELD_SWAP:            "bg-[#ede9fe] text-[#6d28d9]",
};

function getHeaderClass(type: string): string {
  return TYPE_HEADER_COLORS[type] ?? "bg-[#f7f5f2] text-[#6b6258]";
}

const iconBtn = cn(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
  "transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]"
);

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const approveAnomaly = useReviewStore((s) => s.approveAnomaly);
  const discardAnomaly = useReviewStore((s) => s.discardAnomaly);
  const [modalOpen, setModalOpen] = useState(false);

  const isApproved  = anomaly.action === REVIEW_ACTION.APPROVED;
  const isDiscarded = anomaly.action === REVIEW_ACTION.DISCARDED;
  const isCorrected = anomaly.action === REVIEW_ACTION.CORRECTED;
  const isPending   = anomaly.action === REVIEW_ACTION.PENDING;

  const handleUndo = () => {
    useReviewStore.setState((state) => {
      const a = state.anomalies.find((a) => a.id === anomaly.id);
      if (a) {
        a.action = REVIEW_ACTION.PENDING;
        a.userCorrection = undefined;
        a.userCorrectionIr = null;
        a.userCorrectionText = null;
        a.userCorrectionSource = null;
      }
    });
  };

  const sampleValue   = anomaly.sampleValues?.[0];
  const hasAiSuggestion = Boolean(anomaly.aiSuggestion);

  return (
    <>
      {modalOpen && <AnomalyDetailModal anomaly={anomaly} onClose={() => setModalOpen(false)} />}

      <div
        className={cn(
          "border-b border-[#f0ece6] last:border-0 py-3 px-4",
          "transition-colors duration-100",
          isPending && "hover:bg-[#faf9f7] cursor-pointer"
        )}
        onClick={() => isPending && setModalOpen(true)}
      >
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Column badge */}
          <span
            className="bg-[#1a1612] text-white font-semibold text-xs px-2 py-1 rounded-md shrink-0"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {anomaly.column}
          </span>

          {/* Row count + sample */}
          <span className="text-sm text-[#6b6258] shrink-0" style={{ fontFamily: "var(--font-sans)" }}>
            {anomaly.affectedRows} fila{anomaly.affectedRows !== 1 ? "s" : ""}
            {sampleValue && (
              <span className="text-[#9c9189] ml-1">
                · Ejemplo: <span className="italic">&ldquo;{sampleValue}&rdquo;</span>
              </span>
            )}
          </span>

          {/* IA ready badge */}
          {hasAiSuggestion && isPending && (
            <span
              className="flex items-center gap-1 bg-purple-50 text-purple-700 font-semibold text-xs px-2 py-0.5 border border-purple-200 rounded-full"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <Sparkles className="w-3 h-3" /> IA lista
            </span>
          )}

          {/* Status badges */}
          {isApproved && (
            <span className="ml-auto flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold text-xs px-2 py-1 rounded-md" style={{ fontFamily: "var(--font-sans)" }}>
              <CheckCircle2 className="w-3 h-3" /> Aprobada
            </span>
          )}
          {isDiscarded && (
            <span className="ml-auto flex items-center gap-1 bg-red-50 text-red-600 font-semibold text-xs px-2 py-1 rounded-md" style={{ fontFamily: "var(--font-sans)" }}>
              <X className="w-3 h-3" /> Descartada
            </span>
          )}
          {isCorrected && (
            <span className="ml-auto flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold text-xs px-2 py-1 rounded-md" style={{ fontFamily: "var(--font-sans)" }}>
              <CheckCircle2 className="w-3 h-3" /> Corregida
            </span>
          )}

          {/* Quick actions */}
          {isPending && (
            <div className="ml-auto flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => approveAnomaly(anomaly.id)}
                className={cn(iconBtn, "bg-emerald-600 text-white hover:bg-emerald-700")}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <Check className="w-3 h-3" /> Aprobar
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className={cn(iconBtn, "bg-[#1a1612] text-white hover:bg-[#ff6600]")}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <Eye className="w-3 h-3" /> Gestionar
              </button>
              <button
                onClick={() => discardAnomaly(anomaly.id)}
                className={cn(iconBtn, "bg-[#f7f5f2] text-[#9c9189] hover:bg-red-50 hover:text-red-500")}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Undo */}
          {!isPending && (
            <button
              onClick={(e) => { e.stopPropagation(); handleUndo(); }}
              className={cn(iconBtn, "ml-auto bg-[#f7f5f2] text-[#6b6258] hover:bg-[#ede8e1] hover:text-[#1a1612]")}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Deshacer
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function AnomalyGroupCard({ group }: Props) {
  const headerClass = getHeaderClass(group.type);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#ede8e1]">
      {/* Group header */}
      <div className={cn(headerClass, "border-b border-[#ede8e1] px-4 py-3 flex items-center justify-between")}>
        <div>
          <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            {group.label}
          </span>
          <span className="ml-3 font-medium text-sm opacity-70" style={{ fontFamily: "var(--font-sans)" }}>
            {group.anomalies.length} columna{group.anomalies.length !== 1 ? "s" : ""} ·{" "}
            {group.totalRows} fila{group.totalRows !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div>
        {group.anomalies.map((anomaly) => (
          <AnomalyRow key={anomaly.id} anomaly={anomaly} />
        ))}
      </div>
    </div>
  );
}
