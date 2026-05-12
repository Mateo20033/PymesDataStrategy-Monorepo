// Dataset types — aligned with backend (source of truth)
// Backend statuses: PENDING | PROCESSING | READY | ERROR | ARCHIVED

export const DATASET_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  READY: "READY",
  ERROR: "ERROR",
  ARCHIVED: "ARCHIVED",
} as const;

export type DatasetStatus =
  (typeof DATASET_STATUS)[keyof typeof DATASET_STATUS];

export interface Dataset {
  id: string;
  name: string;
  originalFileName: string;
  status: DatasetStatus;
  description?: string;
  storageKey?: string;
  fileSizeBytes: number;
  mimeType: string;
  userId: string;
  schema?: unknown;
  metadata?: Record<string, unknown>;
  statistics?: unknown;
  createdAt: string;
  updatedAt: string;
}
