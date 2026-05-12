"use client";

import { useShallow } from "zustand/react/shallow";
import { Search } from "lucide-react";
import { useAppStore } from "@/store";
import { DATASET_STATUS, type DatasetStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusOptions: { value: DatasetStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: DATASET_STATUS.PENDING, label: "Pendiente" },
  { value: DATASET_STATUS.PROCESSING, label: "Procesando" },
  { value: DATASET_STATUS.READY, label: "Listo" },
  { value: DATASET_STATUS.ERROR, label: "Error" },
  { value: DATASET_STATUS.ARCHIVED, label: "Archivado" },
];

const inputBase = cn(
  "bg-white border border-[#ede8e1] rounded-xl text-sm text-[#1a1612]",
  "focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.10)]",
  "transition-[border-color,box-shadow] duration-150 ease-out"
);

export function FilterBar() {
  const { filter, setFilter } = useAppStore(
    useShallow((state) => ({
      filter: state.filter,
      setFilter: state.setFilter,
    }))
  );

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9c9189]" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          className={cn(inputBase, "w-full pl-9 pr-4 py-2.5 placeholder:text-[#c4bdb5]")}
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </div>

      {/* Status */}
      <select
        value={filter.status}
        onChange={(e) => setFilter({ status: e.target.value as DatasetStatus | "ALL" })}
        className={cn(inputBase, "px-4 py-2.5 min-w-[180px] cursor-pointer appearance-none")}
        style={{
          fontFamily: "var(--font-sans)",
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b6258' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.75rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.2em 1.2em",
          paddingRight: "2.5rem",
        }}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

    </div>
  );
}
