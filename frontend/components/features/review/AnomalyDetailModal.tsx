"use client";

import { useState } from "react";
import { Check, X, PenTool, Sparkles, Loader2 } from "lucide-react";
import { useReviewStore } from "@/store";
import { ANOMALY_TYPE, REVIEW_ACTION } from "@/types";
import type { Anomaly, AnomalyType } from "@/types";
import type { IRCorrection, PreviewResult, PreviewError } from "@/types/ir";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

function isPlausibleAiValue(v: string | null | undefined): v is string {
  if (v === null || v === undefined) return false;
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length === 0 || t.length > 80) return false;
  const lower = t.toLowerCase();
  const instructionVerbs = [
    "asigna", "asignar", "rellena", "rellenar", "elimina", "eliminar",
    "imputa", "imputar", "borra", "borrar", "reempla", "corrige", "corregir",
    "sugier", "usa la media", "usa la moda", "usa la mediana",
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
  return { ir: { op: "FILL_LITERAL", value }, irSource: "rule", irRawText: text.trim() };
}

const ANOMALY_DESCRIPTIONS: Record<AnomalyType, (rows: number) => string> = {
  [ANOMALY_TYPE.FILL_NULLS]:           (rows) => `Se detectaron ${rows} valores nulos (celdas vacías).`,
  [ANOMALY_TYPE.REMOVE_DUPLICATES]:    (rows) => `${rows} registros duplicados encontrados.`,
  [ANOMALY_TYPE.TRIM_WHITESPACE]:      (rows) => `${rows} celdas con espacios en blanco innecesarios.`,
  [ANOMALY_TYPE.FIX_DATE_FORMAT]:      (rows) => `${rows} fechas con formato inconsistente.`,
  [ANOMALY_TYPE.NORMALIZE_CASE]:       (rows) => `${rows} valores con capitalización inconsistente.`,
  [ANOMALY_TYPE.REMOVE_OUTLIERS]:      (rows) => `${rows} valores atípicos (outliers) detectados.`,
  [ANOMALY_TYPE.FIX_PHONE_FORMAT]:     (rows) => `${rows} teléfonos con formato irregular.`,
  [ANOMALY_TYPE.VALIDATE_EMAIL]:       (rows) => `${rows} emails con formato inválido.`,
  [ANOMALY_TYPE.STANDARDIZE_ADDRESS]:  (rows) => `${rows} direcciones sin estandarizar.`,
  [ANOMALY_TYPE.FIX_CURRENCY]:         (rows) => `${rows} valores monetarios con formato inconsistente.`,
  [ANOMALY_TYPE.MERGE_COLUMNS]:        (rows) => `${rows} registros candidatos para fusión de columnas.`,
};

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: PreviewResult }
  | { status: "error"; error: PreviewError };

interface Props {
  anomaly: Anomaly;
  onClose: () => void;
}

const btn = cn(
  "inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg",
  "transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]"
);

export function AnomalyDetailModal({ anomaly, onClose }: Props) {
  const approveAnomaly    = useReviewStore((s) => s.approveAnomaly);
  const discardAnomaly    = useReviewStore((s) => s.discardAnomaly);
  const correctAnomaly    = useReviewStore((s) => s.correctAnomaly);
  const previewInstruction = useReviewStore((s) => s.previewInstruction);
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? undefined;

  const initialEditSeed = isPlausibleAiValue(anomaly.aiActionValue)
    ? anomaly.aiActionValue
    : isPlausibleAiValue(anomaly.suggestedFix)
      ? anomaly.suggestedFix
      : "";

  const [editingAi, setEditingAi]       = useState(false);
  const [editValue, setEditValue]       = useState(initialEditSeed);
  const [aiDismissed, setAiDismissed]   = useState(false);
  const [editingManual, setEditingManual] = useState(false);
  const [manualValue, setManualValue]   = useState(anomaly.userCorrectionText ?? anomaly.userCorrection ?? "");
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle" });

  const isPending = anomaly.action === REVIEW_ACTION.PENDING;
  const description = ANOMALY_DESCRIPTIONS[anomaly.type]?.(anomaly.affectedRows)
    ?? `${anomaly.affectedRows} fila(s) afectadas.`;

  const isNonEmptyNonLiteral = manualValue.trim().length > 0 && !isLiteralText(manualValue);

  const handleVistaPrevia = async () => {
    setPreviewState({ status: "loading" });
    try {
      const result = await previewInstruction(anomaly.id, manualValue.trim(), anomaly.datasetId, accessToken);
      if ("error" in result) {
        setPreviewState({ status: "error", error: result as PreviewError });
      } else {
        setPreviewState({ status: "success", result: result as PreviewResult });
      }
    } catch {
      setPreviewState({
        status: "error",
        error: { error: "gemini_unavailable", message: "No pudimos interpretar la instrucción. Inténtalo de nuevo.", canRetry: true },
      });
    }
  };

  const handleApplyLiteral = () => {
    correctAnomaly(anomaly.id, buildLiteralIRCorrection(manualValue));
    onClose();
  };

  const handleApplyFromPreview = (result: PreviewResult) => {
    correctAnomaly(anomaly.id, { ir: result.ir, irSource: result.source, irRawText: manualValue.trim() });
    onClose();
  };

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
    onClose();
  };

  const inputCls = cn(
    "w-full border border-[#ede8e1] rounded-lg px-3 py-2 text-sm",
    "text-[#1a1612] bg-white placeholder:text-[#9c9189]",
    "focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.10)]",
    "transition-[border-color,box-shadow] duration-150"
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-[0_24px_48px_rgba(0,0,0,.18)] w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="bg-[#1a1612] text-white px-5 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50" style={{ fontFamily: "var(--font-sans)" }}>
              Anomalía
            </span>
            <p className="font-semibold text-base mt-0.5" style={{ fontFamily: "var(--font-sans)" }}>
              Columna: {anomaly.column}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Descripción */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6258] mb-1" style={{ fontFamily: "var(--font-sans)" }}>
              Anomalía detectada
            </p>
            <p className="font-semibold text-base text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>
              {description}
            </p>
            {anomaly.sampleValues?.[0] && (
              <p className="text-sm text-[#6b6258] mt-1" style={{ fontFamily: "var(--font-sans)" }}>
                Ejemplo: <span className="italic font-medium">&ldquo;{anomaly.sampleValues[0]}&rdquo;</span>
              </p>
            )}
          </div>

          {/* Sugerencia básica (sin border-left) */}
          {!anomaly.aiSuggestion && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-700 mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                Sugerencia
              </p>
              <p className="font-medium text-sm text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>
                {anomaly.suggestedFix}
              </p>
            </div>
          )}

          {/* Panel Gemini AI (sin border-left) */}
          {anomaly.aiSuggestion && isPending && !aiDismissed && (
            <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-700 mb-2 flex items-center gap-1" style={{ fontFamily: "var(--font-sans)" }}>
                <Sparkles className="w-3 h-3" /> Gemini AI
              </p>
              {editingAi ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className={inputCls}
                    style={{ fontFamily: "var(--font-sans)" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (editValue.trim()) { correctAnomaly(anomaly.id, editValue.trim()); onClose(); } }}
                      className={cn(btn, "text-xs px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => { setEditingAi(false); setEditValue(initialEditSeed); }}
                      className={cn(btn, "text-xs px-3 py-1.5 border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2]")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-sm mb-2.5 text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>
                    {anomaly.aiSuggestion}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (anomaly.aiActionType === "DELETE") {
                          discardAnomaly(anomaly.id); onClose();
                        } else if (anomaly.aiActionType === "FILL") {
                          if (isPlausibleAiValue(anomaly.aiActionValue)) {
                            correctAnomaly(anomaly.id, anomaly.aiActionValue); onClose();
                          } else {
                            setEditValue(isPlausibleAiValue(anomaly.suggestedFix) ? anomaly.suggestedFix : "");
                            setEditingAi(true);
                          }
                        } else {
                          approveAnomaly(anomaly.id); onClose();
                        }
                      }}
                      className={cn(btn, "text-xs px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      <Check className="w-3 h-3" /> Aceptar IA
                    </button>
                    <button
                      onClick={() => setAiDismissed(true)}
                      className={cn(btn, "text-xs px-3 py-1.5 border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2]")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      <X className="w-3 h-3" /> Rechazar
                    </button>
                    <button
                      onClick={() => { setEditValue(initialEditSeed); setEditingAi(true); }}
                      className={cn(btn, "text-xs px-3 py-1.5 border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2]")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      <PenTool className="w-3 h-3" /> Editar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Edición manual NL Edit */}
          {isPending && editingManual && (
            <div className="space-y-2 border border-[#ede8e1] rounded-lg p-3 bg-[#faf9f7]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6258] mb-1" style={{ fontFamily: "var(--font-sans)" }}>
                Editar corrección
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualValue}
                  onChange={(e) => { setManualValue(e.target.value); setPreviewState({ status: "idle" }); }}
                  placeholder="Escribe tu corrección o instrucción en español..."
                  autoFocus
                  className={inputCls}
                  style={{ fontFamily: "var(--font-sans)" }}
                />
                {isNonEmptyNonLiteral && (
                  <button
                    onClick={handleVistaPrevia}
                    disabled={previewState.status === "loading"}
                    className={cn(btn, "text-xs px-3 py-2 bg-[#ff6600] text-white hover:bg-[#e55a00] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0")}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {previewState.status === "loading"
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Analizando...</>
                      : "Vista previa"}
                  </button>
                )}
              </div>

              {previewState.status === "success" && (
                <div className="border border-[#ede8e1] rounded-lg p-3 bg-white space-y-2">
                  <p className="text-sm font-medium text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>
                    {previewState.result.preview.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {previewState.result.source === "rule" ? (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full" style={{ fontFamily: "var(--font-sans)" }}>
                        ⚡ Regla directa
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full" style={{ fontFamily: "var(--font-sans)" }}>
                        🤖 Interpretado por IA
                      </span>
                    )}
                    <span className="text-xs text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
                      {previewState.result.preview.affectedRows} fila(s) afectada(s)
                    </span>
                  </div>
                  {previewState.result.source === "rule" && !previewState.result.preview.requiresConfirmation ? (
                    <button
                      onClick={() => handleApplyFromPreview(previewState.result)}
                      className={cn(btn, "text-sm px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Aplicar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyFromPreview(previewState.result)}
                      className={cn(btn, "text-sm px-4 py-1.5 bg-purple-600 text-white hover:bg-purple-700")}
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Confirmar
                    </button>
                  )}
                </div>
              )}

              {previewState.status === "error" && previewState.error.error === "gemini_unavailable" && (
                <div className="border border-red-200 rounded-lg bg-red-50 p-3 flex flex-col gap-2">
                  <p className="text-sm font-medium text-red-600" style={{ fontFamily: "var(--font-sans)" }}>
                    {previewState.error.message}
                  </p>
                  <button
                    onClick={handleVistaPrevia}
                    className={cn(btn, "self-start text-xs px-3 py-1.5 border border-red-300 bg-white text-red-600 hover:bg-red-50")}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {previewState.status === "error" && previewState.error.error === "invalid_instruction" && (
                <div className="border border-orange-200 rounded-lg bg-orange-50 p-3">
                  <p className="text-sm font-medium text-orange-700" style={{ fontFamily: "var(--font-sans)" }}>
                    {previewState.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {!isNonEmptyNonLiteral && manualValue.trim().length > 0 && (
                  <button
                    onClick={handleApplyLiteral}
                    className={cn(btn, "flex-1 text-sm py-2 bg-emerald-600 text-white hover:bg-emerald-700")}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Aplicar corrección
                  </button>
                )}
                <button
                  onClick={() => { setEditingManual(false); setPreviewState({ status: "idle" }); }}
                  className={cn(btn, "text-sm px-4 py-2 border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2]")}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botones principales */}
          <div className="pt-2 space-y-2">
            {isPending && !editingManual ? (
              <>
                <button
                  onClick={() => { approveAnomaly(anomaly.id); onClose(); }}
                  className={cn(btn, "w-full text-sm py-2.5 bg-emerald-600 text-white hover:bg-emerald-700")}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <Check className="w-4 h-4" /> Aprobar
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setManualValue(anomaly.userCorrectionText ?? anomaly.userCorrection ?? "");
                      setPreviewState({ status: "idle" });
                      setEditingManual(true);
                    }}
                    className={cn(btn, "text-sm py-2 border border-[#ede8e1] bg-white text-[#1a1612] hover:bg-[#f7f5f2]")}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <PenTool className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => { discardAnomaly(anomaly.id); onClose(); }}
                    className={cn(btn, "text-sm py-2 bg-[#f7f5f2] text-[#9c9189] hover:bg-red-50 hover:text-red-500")}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <X className="w-4 h-4" /> Descartar
                  </button>
                </div>
              </>
            ) : !isPending ? (
              <button
                onClick={handleUndo}
                className={cn(btn, "w-full text-sm py-2.5 border border-[#ede8e1] bg-white text-[#6b6258] hover:bg-[#f7f5f2]")}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Deshacer Acción
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
