// API types — aligned with backend responses
// Dataset model is defined in dataset.ts (single source of truth)
// ApiDataset is a re-export alias for cross-layer compatibility

export type { Dataset as ApiDataset, DatasetStatus } from './dataset'

export type TransformationType =
  | 'CLEAN_NULLS'
  | 'NORMALIZE'
  | 'AGGREGATE'
  | 'FILTER'
  | 'MERGE'
  | 'CUSTOM'

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface TransformDatasetDto {
  transformationType: TransformationType
  parameters?: Record<string, unknown>
  priority?: number
}

// Shape returned by POST /api/v1/datasets (minimal — just id + jobId)
export interface UploadDatasetResponse {
  id: string
  storageKey: string
  status: string
  jobId: string
}

export interface ApiJob {
  id?: string
  jobId: string
  status: JobStatus
  type?: string
  datasetId?: string
  progress?: number
  result?: Record<string, unknown>
  error?: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// Backend list response shape: { success, data: [...], pagination: { limit, offset } }
export interface ApiListResponse<T> {
  success: boolean
  data: T[]
  pagination?: {
    limit: number
    offset: number
  }
}

// ─────────────────────────────────────────────────────────────
// HITL — Anomaly & Decision types
// ─────────────────────────────────────────────────────────────

export interface ApiAnomaly {
  id: string
  datasetId: string
  column: string
  row?: number
  type: 'MISSING_VALUE' | 'OUTLIER' | 'FORMAT_ERROR' | 'FORMAT_INVALID' | 'DUPLICATE' |
        'INCONSISTENT' | 'WHITESPACE_ONLY' | 'SUSPICIOUS_PLACEHOLDER' |
        'LEADING_TRAILING_WHITESPACE' | 'DATE_LOGICAL' | 'NUMERIC_ROUND_NUMBER' |
        'LOW_VARIANCE' | 'OUTLIER_IQR' | 'SEQUENCE_GAP' | 'CROSS_FIELD_SWAP'
  apiType?: string
  description: string
  originalValue?: string
  suggestedValue?: string
  aiSuggestion?: string | null
  aiActionType?: 'FILL' | 'DELETE' | 'KEEP' | null
  aiActionValue?: string | null
  status: 'PENDING' | 'RESOLVED'
  createdAt: string
  updatedAt: string
  decision?: {
    id: string
    anomalyId: string
    action: 'APPROVED' | 'CORRECTED' | 'DISCARDED'
    correction?: string | null
    userId: string
    createdAt: string
  }
}

export interface SubmitDecisionsDto {
  decisions: Array<{
    anomalyId: string
    action: 'APPROVED' | 'CORRECTED' | 'DISCARDED'
    correction?: string
    correctionIr?: import('./ir').IRNode
    irSource?: 'rule' | 'gemini'
    irRawText?: string
  }>
}

export interface SubmitDecisionsResponse {
  resolved: number
  results: Array<{
    anomalyId: string
    action: 'APPROVED' | 'CORRECTED' | 'DISCARDED'
    decisionId: string
  }>
}

