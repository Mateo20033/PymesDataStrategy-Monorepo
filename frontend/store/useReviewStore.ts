import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Anomaly } from "@/types/anomaly";
import { REVIEW_ACTION } from "@/types/anomaly";
import type { IRCorrection, PreviewResult, PreviewError } from "@/types/ir";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

// ─────────────────────────────────────────────────────────────
// localStorage helpers for review progress persistence
// ─────────────────────────────────────────────────────────────

function getStorageKey(datasetId: string) {
  return `pymes_review_${datasetId}`;
}

export function saveProgress(datasetId: string, anomalies: Anomaly[]) {
  const decided = anomalies.filter((a) => a.action !== REVIEW_ACTION.PENDING);
  if (decided.length === 0) return;
  const data = {
    decisions: decided.map((a) => ({
      anomalyId: a.id,
      action: a.action,
      userCorrection: a.userCorrection,
      userCorrectionIr: a.userCorrectionIr,
      userCorrectionText: a.userCorrectionText,
      userCorrectionSource: a.userCorrectionSource,
    })),
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(getStorageKey(datasetId), JSON.stringify(data));
  } catch {}
}

export function loadProgress(datasetId: string) {
  try {
    const raw = localStorage.getItem(getStorageKey(datasetId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearProgress(datasetId: string) {
  try {
    localStorage.removeItem(getStorageKey(datasetId));
  } catch {}
}

interface Progress {
  resolved: number;
  total: number;
  percentage: number;
}

interface ReviewState {
  // State
  anomalies: Anomaly[];
  currentAnomalyIndex: number;
  isSubmitting: boolean;

  // Actions
  setAnomalies: (anomalies: Anomaly[]) => void;
  approveAnomaly: (id: string) => void;
  correctAnomaly: (id: string, correction: string | IRCorrection) => void;
  discardAnomaly: (id: string) => void;
  nextAnomaly: () => void;
  previousAnomaly: () => void;
  resetReview: () => void;
  previewInstruction: (
    anomalyId: string,
    instruction: string,
    datasetId: string,
    accessToken?: string
  ) => Promise<PreviewResult | PreviewError>;

  // Computed (getters)
  getCurrentAnomaly: () => Anomaly | null;
  getProgress: () => Progress;
  getPendingAnomalies: () => Anomaly[];
}

export const useReviewStore = create<ReviewState>()(
  immer((set, get) => ({
    // Initial state
    anomalies: [],
    currentAnomalyIndex: 0,
    isSubmitting: false,

    // Actions
    setAnomalies: (anomalies) =>
      set((state) => {
        state.anomalies = anomalies;
        state.currentAnomalyIndex = 0;
      }),

    approveAnomaly: (id) =>
      set((state) => {
        const anomaly = state.anomalies.find((a: Anomaly) => a.id === id);
        if (anomaly) {
          anomaly.action = REVIEW_ACTION.APPROVED;
        }
      }),

    correctAnomaly: (id, correction) =>
      set((state) => {
        const anomaly = state.anomalies.find((a: Anomaly) => a.id === id);
        if (anomaly) {
          anomaly.action = REVIEW_ACTION.CORRECTED;
          if (typeof correction === "string") {
            // Legacy path: plain string value
            anomaly.userCorrection = correction;
            anomaly.userCorrectionIr = null;
            anomaly.userCorrectionText = null;
            anomaly.userCorrectionSource = null;
          } else {
            // IR path: structured correction
            anomaly.userCorrectionIr = correction.ir;
            anomaly.userCorrectionText = correction.irRawText;
            anomaly.userCorrectionSource = correction.irSource;
            anomaly.userCorrection = undefined;
          }
        }
      }),

    discardAnomaly: (id) =>
      set((state) => {
        const anomaly = state.anomalies.find((a: Anomaly) => a.id === id);
        if (anomaly) {
          anomaly.action = REVIEW_ACTION.DISCARDED;
        }
      }),

    nextAnomaly: () =>
      set((state) => {
        if (state.currentAnomalyIndex < state.anomalies.length - 1) {
          state.currentAnomalyIndex += 1;
        }
      }),

    previousAnomaly: () =>
      set((state) => {
        if (state.currentAnomalyIndex > 0) {
          state.currentAnomalyIndex -= 1;
        }
      }),

    resetReview: () =>
      set((state) => {
        state.anomalies = [];
        state.currentAnomalyIndex = 0;
        state.isSubmitting = false;
      }),

    previewInstruction: async (anomalyId, instruction, datasetId, accessToken) => {
      const result = await apiClient.post<PreviewResult | PreviewError>(
        API_ENDPOINTS.anomalies.parseInstruction(datasetId, anomalyId),
        { instruction },
        accessToken
      );
      return result;
    },

    // Computed (getters)
    getCurrentAnomaly: () => {
      const { anomalies, currentAnomalyIndex } = get();
      return anomalies[currentAnomalyIndex] ?? null;
    },

    getProgress: () => {
      const { anomalies } = get();
      const total = anomalies.length;
      const resolved = anomalies.filter(
        (a) => a.action !== REVIEW_ACTION.PENDING
      ).length;
      const percentage = total === 0 ? 0 : Math.round((resolved / total) * 100);
      return { resolved, total, percentage };
    },

    getPendingAnomalies: () => {
      const { anomalies } = get();
      return anomalies.filter((a) => a.action === REVIEW_ACTION.PENDING);
    },
  }))
);
