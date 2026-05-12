"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AnomalyCard, ReviewHeader, AnomalyGroupCard } from "@/components/features/review";
import { useReviewStore } from "@/store";
import { saveProgress, loadProgress, clearProgress } from "@/store/useReviewStore";
import { useDataset, useAnomalies, useSubmitDecisions } from "@/hooks/api";
import { REVIEW_ACTION } from "@/types";
import type { Anomaly } from "@/types";
import type { ApiAnomaly } from "@/types/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Map a backend ApiAnomaly to the frontend store Anomaly shape.
 * The backend uses its own type vocabulary; the store uses the frontend review vocabulary.
 */
const ANOMALY_TYPE_LABELS: Record<string, string> = {
  MISSING_VALUE: "Valores Faltantes",
  DUPLICATE: "Duplicados",
  FORMAT_INVALID: "Formato Inválido",
  FORMAT_ERROR: "Error de Formato",
  OUTLIER: "Valores Atípicos",
  INCONSISTENT: "Valores Inconsistentes",
  WHITESPACE_ONLY: "Celdas Vacías (espacios)",
  SUSPICIOUS_PLACEHOLDER: "Marcadores de Posición",
  LEADING_TRAILING_WHITESPACE: "Espacios al Inicio/Fin",
  DATE_LOGICAL: "Fechas Incoherentes",
  NUMERIC_ROUND_NUMBER: "Números Redondos Sospechosos",
  LOW_VARIANCE: "Columna Sin Variación",
  OUTLIER_IQR: "Outliers (IQR)",
  SEQUENCE_GAP: "Huecos en Secuencia",
  CROSS_FIELD_SWAP: "Dato en Campo Incorrecto",
};

function mapApiAnomalyToStore(a: ApiAnomaly): Anomaly {
  const typeMap: Record<string, Anomaly["type"]> = {
    MISSING_VALUE: "FILL_NULLS",
    DUPLICATE: "REMOVE_DUPLICATES",
    FORMAT_ERROR: "FIX_DATE_FORMAT",
    FORMAT_INVALID: "VALIDATE_EMAIL",
    OUTLIER: "REMOVE_OUTLIERS",
    INCONSISTENT: "NORMALIZE_CASE",
    WHITESPACE_ONLY: "TRIM_WHITESPACE",
    SUSPICIOUS_PLACEHOLDER: "FILL_NULLS",
    LEADING_TRAILING_WHITESPACE: "TRIM_WHITESPACE",
    DATE_LOGICAL: "FIX_DATE_FORMAT",
    NUMERIC_ROUND_NUMBER: "REMOVE_OUTLIERS",
    LOW_VARIANCE: "REMOVE_OUTLIERS",
    OUTLIER_IQR: "REMOVE_OUTLIERS",
    SEQUENCE_GAP: "REMOVE_DUPLICATES",
    CROSS_FIELD_SWAP: "STANDARDIZE_ADDRESS",
  };

  return {
    id: a.id,
    datasetId: a.datasetId,
    type: typeMap[a.type] ?? "FILL_NULLS",
    apiType: a.type,
    column: a.column,
    affectedRows: a.row ?? 0,
    sampleValues: a.originalValue ? [a.originalValue] : [],
    suggestedFix: a.suggestedValue ?? a.description,
    aiSuggestion: a.aiSuggestion ?? null,
    aiActionType: a.aiActionType ?? null,
    aiActionValue: a.aiActionValue ?? null,
    confidence: 1,
    action: a.decision
      ? (a.decision.action as Anomaly["action"])
      : REVIEW_ACTION.PENDING,
    userCorrection: a.decision?.correction ?? undefined,
  };
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const datasetId = params.id;

  const anomalies = useReviewStore((s) => s.anomalies);
  const setAnomalies = useReviewStore((s) => s.setAnomalies);
  const resetReview = useReviewStore((s) => s.resetReview);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // localStorage restore banner state
  const [restoredCount, setRestoredCount] = useState(0);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedProgress, setSavedProgress] = useState<any>(null);

  // Dataset real desde el backend
  const {
    data: datasetResponse,
    isLoading: isDatasetLoading,
    isError: isDatasetError,
  } = useDataset(datasetId);

  // Anomalías reales desde el backend — polling activo para recibir sugerencias Gemini
  const {
    data: anomaliesResponse,
    isLoading: isAnomaliesLoading,
  } = useAnomalies(datasetId, true);

  const submitDecisionsMutation = useSubmitDecisions(datasetId);

  const dataset = datasetResponse?.data ?? null;

  const pendingCount = anomalies.filter(
    (a) => a.action === REVIEW_ACTION.PENDING
  ).length;

  const [initialized, setInitialized] = useState(false);

  // Primera carga: inicializa el store completo.
  // Recargas por polling: solo actualiza aiSuggestion para no pisar decisiones del usuario.
  useEffect(() => {
    if (!anomaliesResponse?.data) return;

    if (!initialized) {
      const mapped = anomaliesResponse.data.map(mapApiAnomalyToStore);
      setAnomalies(mapped);
      setInitialized(true);
    } else {
      // Refrescar campos de IA desde el backend sin pisar decisiones del usuario.
      // IMPORTANTE: además de `aiSuggestion`, traer `aiActionType` y `aiActionValue`
      // (cuando Gemini responde después del primer load, estos son los que habilitan
      // el botón "Aceptar IA" y el seed del input en "Editar").
      useReviewStore.setState((state) => {
        const updated = state.anomalies.map((a) => {
          const fresh = anomaliesResponse.data.find((r) => r.id === a.id);
          if (!fresh) return a;
          // No tocar anomalías que el usuario ya resolvió
          if (a.action !== REVIEW_ACTION.PENDING) return a;
          return {
            ...a,
            aiSuggestion: fresh.aiSuggestion ?? a.aiSuggestion ?? null,
            aiActionType: fresh.aiActionType ?? a.aiActionType ?? null,
            aiActionValue: fresh.aiActionValue ?? a.aiActionValue ?? null,
            // Preserve IR correction fields — never overwrite local user decisions
            userCorrectionIr: a.userCorrectionIr ?? null,
            userCorrectionText: a.userCorrectionText ?? null,
            userCorrectionSource: a.userCorrectionSource ?? null,
          };
        });
        return { anomalies: updated };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anomaliesResponse]);

  // Check localStorage for saved progress on mount
  useEffect(() => {
    const saved = loadProgress(datasetId);
    if (saved?.decisions?.length > 0) {
      setSavedProgress(saved);
      setRestoredCount(saved.decisions.length);
      setShowRestoreBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  // Auto-save progress whenever anomalies change (after first load)
  useEffect(() => {
    if (initialized && anomalies.length > 0) {
      saveProgress(datasetId, anomalies);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anomalies, initialized, datasetId]);

  useEffect(() => {
    return () => { resetReview(); setInitialized(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitETL = async () => {
    setIsSubmitting(true);
    useReviewStore.setState({ isSubmitting: true });
    try {
      const decisions = anomalies.map((a) => ({
        anomalyId: a.id,
        action: a.action as "APPROVED" | "CORRECTED" | "DISCARDED",
        ...(a.userCorrection !== undefined ? { correction: a.userCorrection } : {}),
        ...(a.userCorrectionIr != null ? { correctionIr: a.userCorrectionIr } : {}),
        ...(a.userCorrectionSource != null ? { irSource: a.userCorrectionSource } : {}),
        ...(a.userCorrectionText != null ? { irRawText: a.userCorrectionText } : {}),
      }));

      await submitDecisionsMutation.mutateAsync({ decisions });
      clearProgress(datasetId);
      toast.success("Decisiones enviadas correctamente. Ejecutando ETL...");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error al enviar decisiones:", err);
      toast.error("Error al enviar las decisiones. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
      useReviewStore.setState({ isSubmitting: false });
    }
  };

  // Build grouped anomalies for rendering
  const groupedAnomalies = Object.entries(
    anomalies.reduce<Record<string, Anomaly[]>>((acc, a) => {
      const key = a.apiType ?? a.type;
      acc[key] = [...(acc[key] ?? []), a];
      return acc;
    }, {})
  ).map(([type, items]) => ({
    type,
    label: ANOMALY_TYPE_LABELS[type] ?? type,
    totalRows: items.reduce((s, a) => s + a.affectedRows, 0),
    anomalies: items,
  }));

  // Loading state
  if (isDatasetLoading || isAnomaliesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
            Cargando revisión...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isDatasetError || !dataset) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="bg-white rounded-xl p-8 text-center border border-[#ede8e1]">
          <p className="text-red-600 font-semibold mb-4 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            Dataset no encontrado o error al cargarlo.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="font-semibold py-2 px-6 rounded-lg bg-[#1a1612] text-white hover:bg-[#ff6600] active:scale-[0.97] transition-[background-color,transform] duration-150 text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* ReviewHeader component — con botón volver y progreso */}
      <ReviewHeader dataset={dataset} onSubmit={handleSubmitETL} />

      <div className="flex-1 p-8 overflow-auto">
        {/* Banner informativo */}
        <div className="bg-[#1a1612] text-white rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2
              className="font-semibold text-base"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Revisión de IA: {dataset.name}
            </h2>
            <p className="text-sm mt-1 text-white/60" style={{ fontFamily: "var(--font-sans)" }}>
              El Agente IA ha perfilado los datos y sugiere las siguientes reglas de limpieza.
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 text-white rounded-xl px-6 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {pendingCount}
            </div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/50 mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>
              Pendientes
            </div>
          </div>
        </div>

        {/* Banner de restauración de progreso */}
        {showRestoreBanner && savedProgress && (
          <div className="bg-[#fff8f4] border border-[#ff6600]/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <p className="font-medium text-[#c2410c] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
              Tienes {restoredCount} decisión(es) guardada(s) del{" "}
              {new Date(savedProgress.savedAt).toLocaleDateString("es-CO")}.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  useReviewStore.setState((state) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    savedProgress.decisions.forEach((d: any) => {
                      const anomaly = state.anomalies.find((a) => a.id === d.anomalyId);
                      if (anomaly) {
                        anomaly.action = d.action;
                        if (d.userCorrection) anomaly.userCorrection = d.userCorrection;
                        if (d.userCorrectionIr) anomaly.userCorrectionIr = d.userCorrectionIr;
                        if (d.userCorrectionText) anomaly.userCorrectionText = d.userCorrectionText;
                        if (d.userCorrectionSource) anomaly.userCorrectionSource = d.userCorrectionSource;
                      }
                    });
                  });
                  setShowRestoreBanner(false);
                  toast.success("Progreso restaurado correctamente.");
                }}
                className="font-semibold text-sm px-4 py-2 rounded-lg bg-[#ff6600] text-white hover:bg-[#e55a00] active:scale-[0.97] transition-[background-color,transform] duration-150"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Retomar
              </button>
              <button
                onClick={() => { clearProgress(datasetId); setShowRestoreBanner(false); }}
                className="font-semibold text-sm px-4 py-2 rounded-lg border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2] transition-colors duration-150"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Grupos de anomalías */}
        {anomalies.length > 0 ? (
          <div className="grid gap-4">
            {groupedAnomalies.map((group) => (
              <AnomalyGroupCard key={group.type} group={group} datasetId={datasetId} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#ede8e1] p-10 text-center">
            <p className="font-semibold text-[#1a1612] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
              No se detectaron anomalías en este dataset.
            </p>
          </div>
        )}

        {/* Mensaje cuando todas resueltas */}
        {pendingCount === 0 && anomalies.length > 0 && (
          <div className="mt-10 flex justify-center">
            <p className="text-sm font-medium text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
              Usa el botón &ldquo;Finalizar revisión&rdquo; en la cabecera para enviar las decisiones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep AnomalyCard imported to avoid breaking existing tests that may reference the component
void AnomalyCard;
