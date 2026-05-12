"use client";

import { Check, X, PenTool, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useReviewStore } from "@/store";
import { ANOMALY_TYPE, REVIEW_ACTION } from "@/types";
import type { Anomaly, AnomalyType } from "@/types";
import type { IRCorrection, PreviewResult, PreviewError } from "@/types/ir";
import { Card } from "@/components/ui/Card";
import { useSession } from "next-auth/react";

function isPlausibleAiValue(v: string | null | undefined): v is string {
  if (v === null || v === undefined) return false;
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length === 0) return false;
  if (t.length > 80) return false;
  const lower = t.toLowerCase();
  const instructionVerbs = [
    "asigna", "asignar",
    "rellena", "rellenar",
    "elimina", "eliminar",
    "imputa", "imputar",
    "borra", "borrar",
    "reempla",
    "corrige", "corregir",
    "sugier",
    "usa la media", "usa la moda", "usa la mediana",
  ];
  if (instructionVerbs.some((w) => lower.includes(w))) return false;
  return true;
}

function isLiteralText(text: string): boolean {
  const t = text.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return true;
  if (t.toLowerCase() === "null") return true;
  if (/^".+"$/.test(t) || /^'.+'$/.test(t)) return true;
  return false;
}

function buildLiteralIRCorrection(text: string): IRCorrection {
  const t = text.trim();
  let value: string | number | null;
  if (t.toLowerCase() === "null") {
    value = null;
  } else if (/^-?\d+(\.\d+)?$/.test(t)) {
    value = Number(t);
  } else {
    value = t.slice(1, -1);
  }
  return {
    ir: { op: "FILL_LITERAL", value },
    irSource: "rule",
    irRawText: text.trim(),
  };
}

const ANOMALY_DESCRIPTIONS: Record<AnomalyType, (rows: number) => string> = {
  [ANOMALY_TYPE.FILL_NULLS]: (rows) => `Se detectaron ${rows} valores nulos (celdas vacías).`,
  [ANOMALY_TYPE.REMOVE_DUPLICATES]: (rows) => `${rows} registros duplicados encontrados.`,
  [ANOMALY_TYPE.TRIM_WHITESPACE]: (rows) => `${rows} celdas con espacios en blanco innecesarios.`,
  [ANOMALY_TYPE.FIX_DATE_FORMAT]: (rows) => `${rows} fechas con formato inconsistente.`,
  [ANOMALY_TYPE.NORMALIZE_CASE]: (rows) => `${rows} valores con capitalización inconsistente.`,
  [ANOMALY_TYPE.REMOVE_OUTLIERS]: (rows) => `${rows} valores atípicos (outliers) detectados.`,
  [ANOMALY_TYPE.FIX_PHONE_FORMAT]: (rows) => `${rows} teléfonos con formato irregular.`,
  [ANOMALY_TYPE.VALIDATE_EMAIL]: (rows) => `${rows} emails con formato inválido.`,
  [ANOMALY_TYPE.STANDARDIZE_ADDRESS]: (rows) => `${rows} direcciones sin estandarizar.`,
  [ANOMALY_TYPE.FIX_CURRENCY]: (rows) => `${rows} valores monetarios con formato inconsistente.`,
  [ANOMALY_TYPE.MERGE_COLUMNS]: (rows) => `${rows} registros candidatos para fusión de columnas.`,
};

interface AnomalyCardProps {
  anomaly: Anomaly;
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: PreviewResult }
  | { status: "error"; error: PreviewError };

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const approveAnomaly = useReviewStore((s) => s.approveAnomaly);
  const discardAnomaly = useReviewStore((s) => s.discardAnomaly);
  const correctAnomaly = useReviewStore((s) => s.correctAnomaly);
  const previewInstruction = useReviewStore((s) => s.previewInstruction);
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? undefined;

  const [editingAi, setEditingAi] = useState(false);
  const initialEditSeed =
    isPlausibleAiValue(anomaly.aiActionValue)
      ? anomaly.aiActionValue
      : isPlausibleAiValue(anomaly.suggestedFix)
        ? anomaly.suggestedFix
        : "";
  const [editValue, setEditValue] = useState(initialEditSeed);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [editingManual, setEditingManual] = useState(false);

  const manualSeed = anomaly.userCorrectionText ?? anomaly.userCorrection ?? "";
  const [manualValue, setManualValue] = useState(manualSeed);
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle" });

  const isPending = anomaly.action === REVIEW_ACTION.PENDING;
  const isApproved = anomaly.action === REVIEW_ACTION.APPROVED;
  const isDiscarded = anomaly.action === REVIEW_ACTION.DISCARDED;

  const description = ANOMALY_DESCRIPTIONS[anomaly.type](anomaly.affectedRows);

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

  const handleOpenManualEdit = () => {
    const seed = anomaly.userCorrectionText ?? anomaly.userCorrection ?? "";
    setManualValue(seed);
    setPreviewState({ status: "idle" });
    setEditingManual(true);
  };

  const isNonEmptyNonLiteral = manualValue.trim().length > 0 && !isLiteralText(manualValue);

  const handleVistaPrevia = async () => {
    setPreviewState({ status: "loading" });
    try {
      const result = await previewInstruction(
        anomaly.id,
        manualValue.trim(),
        anomaly.datasetId,
        accessToken
      );
      if ("error" in result) {
        setPreviewState({ status: "error", error: result as PreviewError });
      } else {
        setPreviewState({ status: "success", result: result as PreviewResult });
      }
    } catch {
      setPreviewState({
        status: "error",
        error: {
          error: "gemini_unavailable",
          message: "No pudimos interpretar la instrucción en este momento. Inténtalo nuevamente en unos segundos o usa una instrucción más simple.",
          canRetry: true,
        },
      });
    }
  };

  const handleApplyLiteral = () => {
    const irCorrection = buildLiteralIRCorrection(manualValue);
    correctAnomaly(anomaly.id, irCorrection);
    setEditingManual(false);
    setPreviewState({ status: "idle" });
  };

  const handleApplyFromPreview = (result: PreviewResult) => {
    const irCorrection: IRCorrection = {
      ir: result.ir,
      irSource: result.source,
      irRawText: manualValue.trim(),
    };
    correctAnomaly(anomaly.id, irCorrection);
    setEditingManual(false);
    setPreviewState({ status: "idle" });
  };

  const handleCancelManualEdit = () => {
    setEditingManual(false);
    setPreviewState({ status: "idle" });
  };

  const handleManualValueChange = (v: string) => {
    setManualValue(v);
    setPreviewState({ status: "idle" });
  };

  return (
    <Card
      className={`bg-white p-6 flex flex-col transition-all${!isPending ? " opacity-60 bg-gray-50" : ""}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className="bg-[#1e293b] text-white font-semibold px-3 py-1 text-sm rounded-md">
          Columna: {anomaly.column}
        </span>
        {isApproved && <CheckCircle2 className="w-8 h-8 text-[#059669]" />}
        {isDiscarded && <X className="w-8 h-8 text-[#dc2626]" />}
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase text-[#64748b] mb-1">
            Anomalía Detectada
          </p>
          <p className="font-semibold text-lg text-[#1e293b]">{description}</p>
        </div>
        {!anomaly.aiSuggestion && (
          <div className="bg-[#dbeafe] p-3 rounded-lg border-l-4 border-[#1d4ed8]">
            <p className="text-xs font-semibold uppercase text-[#1d4ed8] mb-1">
              Sugerencia IA
            </p>
            <p className="font-medium text-[#1e293b] text-sm">{anomaly.suggestedFix}</p>
          </div>
        )}

        {/* Sugerencia Gemini */}
        {anomaly.aiSuggestion && isPending && !aiDismissed && (
          <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
            <p className="text-xs font-semibold uppercase text-purple-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini AI
            </p>
            {editingAi ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.12)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editValue.trim()) {
                        correctAnomaly(anomaly.id, editValue.trim());
                        setEditingAi(false);
                      }
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#059669] text-white hover:bg-[#047857] transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => {
                      setEditingAi(false);
                      const seed = isPlausibleAiValue(anomaly.aiActionValue)
                        ? anomaly.aiActionValue
                        : isPlausibleAiValue(anomaly.suggestedFix)
                          ? anomaly.suggestedFix
                          : "";
                      setEditValue(seed);
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium text-sm mb-2 text-[#1e293b]">{anomaly.aiSuggestion}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      if (anomaly.aiActionType === 'DELETE') {
                        discardAnomaly(anomaly.id);
                      } else if (anomaly.aiActionType === 'FILL') {
                        if (isPlausibleAiValue(anomaly.aiActionValue)) {
                          correctAnomaly(anomaly.id, anomaly.aiActionValue);
                        } else {
                          setEditValue(isPlausibleAiValue(anomaly.suggestedFix) ? anomaly.suggestedFix : "");
                          setEditingAi(true);
                        }
                      } else {
                        approveAnomaly(anomaly.id);
                      }
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Aceptar IA
                  </button>
                  <button
                    onClick={() => setAiDismissed(true)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Rechazar
                  </button>
                  <button
                    onClick={() => {
                      const seed = isPlausibleAiValue(anomaly.aiActionValue)
                        ? anomaly.aiActionValue
                        : isPlausibleAiValue(anomaly.suggestedFix)
                          ? anomaly.suggestedFix
                          : "";
                      setEditValue(seed);
                      setEditingAi(true);
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] transition-colors flex items-center gap-1"
                  >
                    <PenTool className="w-3 h-3" /> Editar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Botones */}
      {isPending ? (
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => approveAnomaly(anomaly.id)}
            className="col-span-2 font-semibold py-2 px-6 rounded-lg bg-[#059669] text-white hover:bg-[#047857] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Aprobar Regla
          </button>
          <button
            onClick={() => discardAnomaly(anomaly.id)}
            className="font-semibold py-2 px-6 rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Descartar
          </button>
          <button
            onClick={handleOpenManualEdit}
            className="font-semibold py-2 px-6 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4" /> Editar
          </button>
          {editingManual && (
            <div className="col-span-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualValue}
                  onChange={(e) => handleManualValueChange(e.target.value)}
                  placeholder="Escribe tu corrección o instrucción en español..."
                  autoFocus
                  className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.12)]"
                />
                {isNonEmptyNonLiteral && (
                  <button
                    onClick={handleVistaPrevia}
                    disabled={previewState.status === "loading"}
                    className="font-semibold py-2 px-3 rounded-lg bg-[#ff6600] text-white hover:bg-[#cc5200] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                  >
                    {previewState.status === "loading" ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Analizando...</>
                    ) : (
                      "Vista previa"
                    )}
                  </button>
                )}
              </div>

              {previewState.status === "success" && (
                <div className="border border-[#e2e8f0] rounded-lg p-3 space-y-2 bg-[#f8fafc]">
                  <p className="text-sm font-medium text-[#1e293b]">{previewState.result.preview.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {previewState.result.source === "rule" ? (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-[#d1fae5] text-[#059669] border border-[#6ee7b7] rounded">
                        ⚡ Regla directa
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded">
                        🤖 Interpretado por IA
                      </span>
                    )}
                    <span className="text-xs text-[#64748b]">
                      {previewState.result.preview.affectedRows} fila(s) afectada(s)
                    </span>
                  </div>
                  {previewState.result.source === "rule" && !previewState.result.preview.requiresConfirmation ? (
                    <button
                      onClick={() => handleApplyFromPreview(previewState.result)}
                      className="font-semibold py-1 px-4 rounded-lg bg-[#059669] text-white hover:bg-[#047857] transition-colors text-sm"
                    >
                      Aplicar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyFromPreview(previewState.result)}
                      className="font-semibold py-1 px-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm"
                    >
                      Confirmar
                    </button>
                  )}
                </div>
              )}

              {previewState.status === "error" && previewState.error.error === "gemini_unavailable" && (
                <div className="border border-[#fca5a5] rounded-lg bg-[#fee2e2] p-3 flex flex-col gap-2">
                  <p className="text-sm font-medium text-[#dc2626]">{previewState.error.message}</p>
                  <button
                    onClick={handleVistaPrevia}
                    className="self-start text-xs font-semibold px-3 py-1 rounded-lg border border-[#dc2626] bg-white text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {previewState.status === "error" && previewState.error.error === "invalid_instruction" && (
                <div className="border border-[#fdba74] rounded-lg bg-[#fff7ed] p-3">
                  <p className="text-sm font-medium text-[#c2410c]">{previewState.error.message}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!isNonEmptyNonLiteral && manualValue.trim().length > 0 && (
                  <button
                    onClick={handleApplyLiteral}
                    className="flex-1 font-semibold py-2 rounded-lg bg-[#059669] text-white hover:bg-[#047857] transition-colors text-sm"
                  >
                    Aplicar corrección
                  </button>
                )}
                <button
                  onClick={handleCancelManualEdit}
                  className="font-semibold py-2 px-4 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          <button
            onClick={handleUndo}
            className="w-full font-semibold py-2 px-6 rounded-lg border border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            Deshacer Acción
          </button>
        </div>
      )}
    </Card>
  );
}
