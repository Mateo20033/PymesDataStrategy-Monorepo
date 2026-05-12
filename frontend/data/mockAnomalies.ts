import type { Anomaly } from "@/types";
import { ANOMALY_TYPE, REVIEW_ACTION } from "@/types";

export const mockAnomalies: Anomaly[] = [
  {
    id: "anom-001",
    datasetId: "ds-002",
    type: ANOMALY_TYPE.FILL_NULLS,
    column: "Teléfono",
    affectedRows: 45,
    sampleValues: ["", "NULL", "N/A", "-", "sin dato"],
    suggestedFix: "Rellenar con valor por defecto o eliminar filas",
    confidence: 0.92,
    action: REVIEW_ACTION.PENDING,
  },
  {
    id: "anom-002",
    datasetId: "ds-002",
    type: ANOMALY_TYPE.REMOVE_DUPLICATES,
    column: "Cédula",
    affectedRows: 12,
    sampleValues: ["12345678", "12345678", "87654321", "87654321"],
    suggestedFix: "Eliminar filas duplicadas manteniendo la primera ocurrencia",
    confidence: 0.98,
    action: REVIEW_ACTION.PENDING,
  },
  {
    id: "anom-003",
    datasetId: "ds-002",
    type: ANOMALY_TYPE.TRIM_WHITESPACE,
    column: "Nombre",
    affectedRows: 28,
    sampleValues: ["  Juan Pérez", "María García  ", "  Carlos López  "],
    suggestedFix: "Eliminar espacios en blanco al inicio y final",
    confidence: 0.95,
    action: REVIEW_ACTION.PENDING,
  },
];
