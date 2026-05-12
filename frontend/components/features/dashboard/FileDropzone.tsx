"use client";

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { UploadCloud, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "@/components/ui";
import { useAppStore } from "@/store";
import { useUploadDataset } from "@/hooks/api";
import { useJobPoller } from "@/hooks/useJobPoller";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function FileDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { isUploading, uploadProgress, setUploading } = useAppStore(
    useShallow((state) => ({
      isUploading: state.isUploading,
      uploadProgress: state.uploadProgress,
      setUploading: state.setUploading,
    }))
  );

  const uploadMutation = useUploadDataset();
  const { jobStatus, isCompleted, isFailed, error: jobError } = useJobPoller(jobId);

  useEffect(() => {
    if (isCompleted || isFailed) {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    }
    if (isCompleted) {
      toast.success("¡ETL completado! El dataset está listo.");
      const timer = setTimeout(() => setJobId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isFailed, queryClient]);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
    if (!isValidType) return "Solo se aceptan archivos CSV, XLSX o XLS.";
    if (file.size > MAX_FILE_SIZE) return "El archivo excede el límite de 10MB.";
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setError(null);
    setJobId(null);
    setUploading(true, 0);

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      setUploading(true, progress);
    }, 150);

    uploadMutation.mutate(file, {
      onSuccess: (response) => {
        clearInterval(progressInterval);
        setUploading(true, 100);
        toast.success("Archivo subido. Procesando...");
        setTimeout(() => {
          setUploading(false, 0);
          if (response?.data?.jobId) setJobId(response.data.jobId);
        }, 500);
      },
      onError: () => {
        clearInterval(progressInterval);
        setError("Error al subir el archivo. Intenta de nuevo.");
        toast.error("Error al subir el archivo.");
        setUploading(false, 0);
      },
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleClick = () => { if (!isUploading && jobId === null) fileInputRef.current?.click(); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };
  const handleRetry = () => { setJobId(null); setError(null); };

  const isProcessing = jobId !== null && !isCompleted && !isFailed;
  const isIdle = !isUploading && !isProcessing && !isCompleted && !isFailed;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "bg-white rounded-xl border-2 border-dashed",
        "flex flex-col items-center justify-center p-10 text-center",
        "h-full min-h-[280px]",
        "transition-[border-color,background-color] duration-150 ease-out",
        isDragging
          ? "border-[#ff6600] bg-[#fff8f4]"
          : "border-[#ede8e1] hover:border-[#ff6600] hover:bg-[#fff8f4]",
        (isUploading || isProcessing) && "cursor-not-allowed",
        isIdle && "cursor-pointer"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || isProcessing}
      />

      {/* Subiendo */}
      {isUploading && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-[#fff0e6] flex items-center justify-center mb-2">
            <UploadCloud className="w-6 h-6 text-[#ff6600] animate-pulse" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[#1a1612] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            Subiendo archivo...
          </p>
          <div className="w-full">
            <ProgressBar value={uploadProgress} size="md" showLabel />
          </div>
        </div>
      )}

      {/* Procesando */}
      {!isUploading && isProcessing && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-[#fff0e6] flex items-center justify-center mb-2">
            <Loader2 className="w-6 h-6 text-[#ff6600] animate-spin" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[#1a1612] text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            Procesando dataset...
          </p>
          {jobStatus && (
            <span className="text-xs bg-[#f7f5f2] border border-[#ede8e1] rounded-lg px-3 py-1 text-[#6b6258]"
              style={{ fontFamily: "var(--font-sans)" }}>
              {jobStatus}
            </span>
          )}
        </div>
      )}

      {/* Completado */}
      {!isUploading && isCompleted && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-emerald-700 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            ¡Dataset listo!
          </p>
        </div>
      )}

      {/* Fallido */}
      {!isUploading && isFailed && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
            <XCircle className="w-6 h-6 text-red-500" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-red-600 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            Error al procesar
          </p>
          {jobError && (
            <p className="text-xs text-red-500" style={{ fontFamily: "var(--font-sans)" }}>{jobError}</p>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="w-full py-2.5 px-5 rounded-xl bg-[#ff6600] text-white text-sm font-semibold
              hover:bg-[#e55a00] active:scale-[0.97]
              transition-[background-color,transform] duration-150 ease-out"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Idle */}
      {isIdle && (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#fff0e6] flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-[#ff6600]" strokeWidth={1.5} />
          </div>
          <h3
            className="text-sm font-semibold text-[#1a1612] mb-1"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Arrastra tu Excel aquí
          </h3>
          <p className="text-xs text-[#6b6258] mb-6" style={{ fontFamily: "var(--font-sans)" }}>
            Máximo 50,000 registros (.xlsx)
          </p>
          <button
            type="button"
            className="w-full py-2.5 px-5 rounded-xl bg-[#ff6600] text-white text-sm font-semibold
              hover:bg-[#e55a00] hover:shadow-[0_4px_16px_rgba(255,102,0,.3)]
              active:scale-[0.97]
              transition-[background-color,box-shadow,transform] duration-150 ease-out"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Seleccionar Archivo
          </button>
        </>
      )}

      {error && !isFailed && (
        <p className="mt-4 text-xs text-red-500 font-medium" style={{ fontFamily: "var(--font-sans)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
