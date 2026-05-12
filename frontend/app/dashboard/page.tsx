"use client";

import { useEffect, useRef } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone, DatasetsTable, FilterBar, MetricsBand } from "@/components/features/dashboard";
import { useDatasets } from "@/hooks/api";
import { useAppStore } from "@/store";
import { useGlobalSSE } from "@/hooks/useGlobalSSE";

export default function DashboardPage() {
  useGlobalSSE();

  const { data, isLoading, isError } = useDatasets();
  const setDatasets = useAppStore((state) => state.setDatasets);
  const prevStatusesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!data?.data) return;
    setDatasets(data.data);

    const prevStatuses = prevStatusesRef.current;
    for (const dataset of data.data) {
      const prev = prevStatuses[dataset.id];
      if (prev && prev !== dataset.status) {
        if (dataset.status === "READY") {
          toast.success(`"${dataset.name}" listo para revisión`, { duration: 5000 });
        } else if (dataset.status === "ERROR") {
          toast.error(`Error al procesar "${dataset.name}"`, { duration: 8000 });
        }
      }
    }
    prevStatusesRef.current = Object.fromEntries(data.data.map((d) => [d.id, d.status]));
  }, [data?.data, setDatasets]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-8">

        {/* Header */}
        <div className="flex justify-between items-end mb-8 pb-6 border-b border-[#ede8e1]">
          <div>
            <h2
              className="text-[#1a1612] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}
            >
              Panel de Control
            </h2>
            <p
              className="text-[#6b6258] text-sm mt-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Sube tus archivos Excel para análisis estructurado.
            </p>
          </div>
        </div>

        {/* Métricas */}
        <MetricsBand />

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">

          {/* Dropzone */}
          <div className="lg:col-span-1">
            <FileDropzone />
          </div>

          {/* Tabla */}
          <div className="lg:col-span-2 space-y-4">
            <h3
              className="flex items-center gap-2 text-[#1a1612] font-semibold text-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#6b6258]" strokeWidth={1.5} />
              Archivos Recientes
            </h3>

            {isLoading && (
              <div className="bg-white rounded-xl border border-[#ede8e1] p-8 text-center">
                <div className="w-5 h-5 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
                  Cargando datasets...
                </p>
              </div>
            )}

            {isError && (
              <div className="bg-white rounded-xl border border-[#ede8e1] p-8 text-center">
                <p className="text-sm font-medium text-[#dc2626]" style={{ fontFamily: "var(--font-sans)" }}>
                  Error al cargar los datasets. Intenta de nuevo.
                </p>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="space-y-3">
                <FilterBar />
                <DatasetsTable />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
