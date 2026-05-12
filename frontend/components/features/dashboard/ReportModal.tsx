"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ReportResponse {
  stats: {
    totalAnomalies: number;
    approved: number;
    corrected: number;
    discarded: number;
    pending: number;
    byType: Record<string, { count: number; action: string }>;
    datasetName: string;
  };
  narrative: string;
}

interface Props {
  datasetId: string;
  datasetName: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  MISSING_VALUE:               "Valores faltantes",
  DUPLICATE:                   "Duplicados",
  FORMAT_INVALID:              "Formato inválido",
  OUTLIER:                     "Valores atípicos",
  INCONSISTENT:                "Inconsistentes",
  WHITESPACE_ONLY:             "Espacios vacíos",
  SUSPICIOUS_PLACEHOLDER:      "Marcadores",
  LEADING_TRAILING_WHITESPACE: "Espacios al inicio/fin",
  DATE_LOGICAL:                "Fechas incoherentes",
  NUMERIC_ROUND_NUMBER:        "Números redondos",
  LOW_VARIANCE:                "Baja variación",
  OUTLIER_IQR:                 "Outliers IQR",
  SEQUENCE_GAP:                "Huecos en secuencia",
  CROSS_FIELD_SWAP:            "Campo incorrecto",
};

const ACTION_LABELS: Record<string, string> = {
  APPROVED:  "Aprobadas",
  CORRECTED: "Corregidas",
  DISCARDED:  "Eliminadas",
  PENDING:   "Pendientes",
};

const ACTION_COLORS: Record<string, string> = {
  APPROVED:  "text-emerald-700",
  CORRECTED: "text-blue-700",
  DISCARDED:  "text-red-500",
  PENDING:   "text-[#9c9189]",
};

export function ReportModal({ datasetId, datasetName, onClose }: Props) {
  const { data: session } = useSession();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<{ success: boolean; data: ReportResponse }>(
        `/api/v1/datasets/${datasetId}/report`,
        {},
        session?.accessToken ?? undefined
      );
      setReport(result.data);
    } catch {
      setError("No se pudo generar el informe. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [datasetId]);

  const statCards = report ? [
    { label: "Total",      value: report.stats.totalAnomalies, accent: false },
    { label: "Aprobadas",  value: report.stats.approved,       accent: true,  color: "text-emerald-700", bg: "bg-emerald-50"  },
    { label: "Corregidas", value: report.stats.corrected,      accent: true,  color: "text-blue-700",    bg: "bg-blue-50"     },
    { label: "Eliminadas", value: report.stats.discarded,      accent: true,  color: "text-red-500",     bg: "bg-red-50"      },
  ] : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-[0_24px_48px_rgba(0,0,0,.18)] w-full max-w-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1a1612] text-white px-5 py-4 flex items-start justify-between rounded-t-xl shrink-0">
          <div className="min-w-0 pr-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest text-white/50"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Informe de Calidad
            </span>
            <p
              className="font-semibold text-sm mt-0.5 text-white truncate"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {datasetName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">

          {/* Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#ff6600] animate-spin" strokeWidth={1.5} />
              <p className="text-sm text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
                Generando informe con Gemini...
              </p>
              <div className="w-full space-y-2 mt-2">
                {[80, 60, 72, 50].map((w, i) => (
                  <div key={i} className="h-3 bg-[#f0ece6] rounded-full animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="py-10 flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-red-500" style={{ fontFamily: "var(--font-sans)" }}>
                {error}
              </p>
              <button
                onClick={fetchReport}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold",
                  "border border-[#ede8e1] bg-white text-[#1a1612] hover:bg-[#f7f5f2]",
                  "transition-colors duration-150 active:scale-[0.97]"
                )}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                Reintentar
              </button>
            </div>
          )}

          {/* Report content */}
          {report && (
            <>
              {/* Stats grid */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6258] mb-3"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Resumen Estadístico
                </p>
                <div className="grid grid-cols-4 gap-px bg-[#ede8e1] rounded-xl overflow-hidden">
                  {statCards.map(({ label, value, color, bg }) => (
                    <div
                      key={label}
                      className={cn("p-4 text-center", bg ?? "bg-[#f7f5f2]")}
                    >
                      <p
                        className={cn("text-2xl font-bold", color ?? "text-[#1a1612]")}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {value}
                      </p>
                      <p
                        className={cn("text-[10px] font-semibold uppercase tracking-wide mt-0.5", color ? color + "/70" : "text-[#6b6258]")}
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* By type */}
              {Object.keys(report.stats.byType).length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6258] mb-3"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Cambios por Tipo
                  </p>
                  <div className="bg-white rounded-xl border border-[#ede8e1] overflow-hidden">
                    {Object.entries(report.stats.byType).map(([type, data], i, arr) => (
                      <div
                        key={type}
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5",
                          i !== arr.length - 1 && "border-b border-[#f0ece6]"
                        )}
                      >
                        <span
                          className="text-sm text-[#1a1612]"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {TYPE_LABELS[type] ?? type}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="text-sm font-semibold text-[#1a1612]"
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            {data.count}
                          </span>
                          <span className="text-[#9c9189] text-xs">→</span>
                          <span
                            className={cn("text-xs font-semibold", ACTION_COLORS[data.action] ?? "text-[#6b6258]")}
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            {ACTION_LABELS[data.action] ?? data.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Narrative */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6258] mb-3 flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Análisis IA (Gemini)
                </p>
                <div className="bg-[#faf9f7] border border-[#ede8e1] rounded-xl p-4">
                  <p
                    className="text-sm text-[#1a1612] leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {report.narrative}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
