import { z } from "zod";
import { DATASET_STATUS, REVIEW_ACTION } from "@/types";

// ─────────────────────────────────────────────────────────────
// Auth schemas
// ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email({ error: 'Correo electrónico no válido' }),
  password: z.string().min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }),
})

export const registerSchema = z.object({
  name: z.string().min(2, { error: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.email({ error: 'Correo electrónico no válido' }),
  password: z.string().min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export const uploadFileSchema = z
  .custom<File>((val) => val instanceof File, { error: "Must be a file" })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File size must be less than 10MB`,
  })
  .refine(
    (file) => {
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      return ALLOWED_EXTENSIONS.includes(extension);
    },
    {
      message: `File must be one of: ${ALLOWED_EXTENSIONS.join(", ")}`,
    }
  );

export const datasetFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      DATASET_STATUS.PENDING,
      DATASET_STATUS.PROCESSING,
      DATASET_STATUS.READY,
      DATASET_STATUS.ERROR,
      DATASET_STATUS.ARCHIVED,
    ])
    .optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "rowCount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type DatasetFilter = z.infer<typeof datasetFilterSchema>;

export const reviewDecisionSchema = z.object({
  anomalyId: z.string().min(1, { error: "Anomaly ID is required" }),
  action: z.enum([
    REVIEW_ACTION.APPROVED,
    REVIEW_ACTION.CORRECTED,
    REVIEW_ACTION.DISCARDED,
  ]),
  correction: z.string().optional(),
});

export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

export const batchDecisionSchema = z
  .array(reviewDecisionSchema)
  .min(1, { error: "At least one decision is required" });

export type BatchDecision = z.infer<typeof batchDecisionSchema>;
