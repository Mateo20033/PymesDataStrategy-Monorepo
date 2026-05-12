"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Eye, Download, Trash2, FileText, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui";
import { useAppStore } from "@/store";
import { useDeleteDataset } from "@/hooks/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { DATASET_STATUS, type DatasetStatus } from "@/types";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

const statusConfig: Record<
  DatasetStatus,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  [DATASET_STATUS.PENDING]: { label: "Pendiente", variant: "default" },
  [DATASET_STATUS.PROCESSING]: { label: "Procesando", variant: "info" },
  [DATASET_STATUS.READY]: { label: "Listo", variant: "success" },
  [DATASET_STATUS.ERROR]: { label: "Error", variant: "error" },
  [DATASET_STATUS.ARCHIVED]: { label: "Archivado", variant: "default" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const iconBtn = cn(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
  "transition-[background-color,color,transform] duration-150 ease-out",
  "active:scale-[0.97]"
);

export function DatasetsTable() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? undefined;
  const deleteDatasetMutation = useDeleteDataset();
  const [reportDatasetId, setReportDatasetId] = useState<string | null>(null);

  const { getFilteredDatasets } = useAppStore(
    useShallow((state) => ({ getFilteredDatasets: state.getFilteredDatasets }))
  );
  const datasets = getFilteredDatasets();

  const handleReview = (id: string) => router.push(`/dashboard/review/${id}`);
  const handleDownload = (id: string) => {
    if (!token) { toast.error("No se pudo obtener el enlace de descarga."); return; }
    window.open(API_ENDPOINTS.datasets.stream(id, token), "_blank");
  };
  const handleDelete = (id: string) => deleteDatasetMutation.mutate(id);

  if (datasets.length === 0) {
    return (
      <div className="flex items-center justify-center py-14 rounded-xl bg-white border border-[#ede8e1]">
        <p className="text-sm text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
          No hay datasets cargados
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-[#ede8e1]">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-[#ede8e1]">
              {["Nombre", "Tamaño", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-3 text-[10px] font-semibold text-[#6b6258] tracking-widest uppercase",
                    h === "" ? "text-right" : "text-left"
                  )}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datasets.map((dataset, index) => {
              const config = statusConfig[dataset.status];
              const isLast = index === datasets.length - 1;

              return (
                <tr
                  key={dataset.id}
                  className={cn(
                    "bg-white hover:bg-[#faf9f7] transition-colors duration-100",
                    !isLast && "border-b border-[#f0ece6]"
                  )}
                >
                  <td className="px-4 py-3">
                    <p
                      className="font-semibold text-sm text-[#1a1612]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {dataset.name}
                    </p>
                    <p
                      className="text-[11px] text-[#9c9189] mt-0.5"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {dataset.originalFileName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm text-[#6b6258]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {formatFileSize(dataset.fileSizeBytes)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {dataset.status === DATASET_STATUS.PROCESSING && (
                        <button
                          onClick={() => handleReview(dataset.id)}
                          className={cn(iconBtn, "bg-[#1a1612] text-white hover:bg-[#ff6600]")}
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Ver Detalle
                        </button>
                      )}
                      {dataset.status === DATASET_STATUS.READY && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/${dataset.id}`)}
                            className={cn(iconBtn, "bg-[#1a1612] text-white hover:bg-[#333]")}
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            <BarChart2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Ver Analíticas
                          </button>
                          <button
                            onClick={() => setReportDatasetId(dataset.id)}
                            className={cn(iconBtn, "bg-[#f7f5f2] text-[#1a1612] hover:bg-[#ede8e1]")}
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Informe
                          </button>
                          <button
                            onClick={() => handleDownload(dataset.id)}
                            className={cn(iconBtn, "bg-[#ff6600] text-white hover:bg-[#e55a00]")}
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Descargar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(dataset.id)}
                        disabled={deleteDatasetMutation.isPending}
                        className={cn(iconBtn, "bg-[#f7f5f2] text-[#9c9189] hover:bg-red-50 hover:text-red-500 disabled:opacity-40")}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reportDatasetId && (
        <ReportModal
          datasetId={reportDatasetId}
          datasetName={datasets.find((d) => d.id === reportDatasetId)?.name ?? reportDatasetId}
          onClose={() => setReportDatasetId(null)}
        />
      )}
    </>
  );
}
