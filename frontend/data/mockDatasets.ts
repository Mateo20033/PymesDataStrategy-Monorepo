import type { Dataset } from "@/types";
import { DATASET_STATUS } from "@/types";

export const mockDatasets: Dataset[] = [
  {
    id: "ds-001",
    name: "Ventas_2025",
    originalFileName: "Ventas_2025.xlsx",
    fileSizeBytes: 245760,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    status: DATASET_STATUS.READY,
    userId: "user-001",
    createdAt: "2025-03-10T14:30:00Z",
    updatedAt: "2025-03-10T15:45:00Z",
  },
  {
    id: "ds-002",
    name: "Nomina",
    originalFileName: "Nomina.xlsx",
    fileSizeBytes: 184320,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    status: DATASET_STATUS.READY,
    userId: "user-001",
    createdAt: "2025-03-11T09:15:00Z",
    updatedAt: "2025-03-11T10:20:00Z",
  },
  {
    id: "ds-003",
    name: "Clientes_Q1",
    originalFileName: "Clientes_Q1.csv",
    fileSizeBytes: 512000,
    mimeType: "text/csv",
    status: DATASET_STATUS.PROCESSING,
    userId: "user-001",
    createdAt: "2025-03-12T08:00:00Z",
    updatedAt: "2025-03-12T08:45:00Z",
  },
];
