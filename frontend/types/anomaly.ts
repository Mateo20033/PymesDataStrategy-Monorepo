export const ANOMALY_TYPE = {
  FILL_NULLS: "FILL_NULLS",
  REMOVE_DUPLICATES: "REMOVE_DUPLICATES",
  TRIM_WHITESPACE: "TRIM_WHITESPACE",
  FIX_DATE_FORMAT: "FIX_DATE_FORMAT",
  NORMALIZE_CASE: "NORMALIZE_CASE",
  REMOVE_OUTLIERS: "REMOVE_OUTLIERS",
  FIX_PHONE_FORMAT: "FIX_PHONE_FORMAT",
  VALIDATE_EMAIL: "VALIDATE_EMAIL",
  STANDARDIZE_ADDRESS: "STANDARDIZE_ADDRESS",
  FIX_CURRENCY: "FIX_CURRENCY",
  MERGE_COLUMNS: "MERGE_COLUMNS",
} as const;

export type AnomalyType = (typeof ANOMALY_TYPE)[keyof typeof ANOMALY_TYPE];

export const REVIEW_ACTION = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  CORRECTED: "CORRECTED",
  DISCARDED: "DISCARDED",
} as const;

export type ReviewAction = (typeof REVIEW_ACTION)[keyof typeof REVIEW_ACTION];

export interface Anomaly {
  id: string;
  datasetId: string;
  type: AnomalyType;
  apiType?: string;
  column: string;
  affectedRows: number;
  sampleValues: string[];
  suggestedFix: string;
  aiSuggestion?: string | null;
  aiActionType?: 'FILL' | 'DELETE' | 'KEEP' | null;
  aiActionValue?: string | null;
  confidence: number;
  action: ReviewAction;
  userCorrection?: string;
  userCorrectionIr?: import('./ir').IRNode | null;
  userCorrectionText?: string | null;
  userCorrectionSource?: 'rule' | 'gemini' | null;
}
