import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Dataset, DatasetStatus } from "@/types/dataset";

interface FilterState {
  status: DatasetStatus | "ALL";
  search: string;
}

interface AppState {
  // State
  datasets: Dataset[];
  selectedDatasetId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  filter: FilterState;

  // Actions
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  removeDataset: (id: string) => void;
  selectDataset: (id: string | null) => void;
  setUploading: (isUploading: boolean, progress?: number) => void;
  setFilter: (filter: Partial<FilterState>) => void;

  // Computed (getters)
  getFilteredDatasets: () => Dataset[];
  getSelectedDataset: () => Dataset | null;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // Initial state
    datasets: [],
    selectedDatasetId: null,
    isUploading: false,
    uploadProgress: 0,
    filter: {
      status: "ALL",
      search: "",
    },

    // Actions
    setDatasets: (datasets) =>
      set((state) => {
        state.datasets = datasets;
      }),

    addDataset: (dataset) =>
      set((state) => {
        state.datasets.push(dataset);
      }),

    updateDataset: (id, updates) =>
      set((state) => {
        const index = state.datasets.findIndex(
          (d: Dataset) => d.id === id
        );
        if (index !== -1) {
          Object.assign(state.datasets[index], updates);
        }
      }),

    removeDataset: (id) =>
      set((state) => {
        state.datasets = state.datasets.filter((d: Dataset) => d.id !== id);
        if (state.selectedDatasetId === id) {
          state.selectedDatasetId = null;
        }
      }),

    selectDataset: (id) =>
      set((state) => {
        state.selectedDatasetId = id;
      }),

    setUploading: (isUploading, progress = 0) =>
      set((state) => {
        state.isUploading = isUploading;
        state.uploadProgress = progress;
      }),

    setFilter: (filterUpdate) =>
      set((state) => {
        Object.assign(state.filter, filterUpdate);
      }),

    // Computed (getters)
    getFilteredDatasets: () => {
      const { datasets, filter } = get();
      return datasets.filter((dataset) => {
        const matchesStatus =
          filter.status === "ALL" || dataset.status === filter.status;
        const matchesSearch =
          filter.search === "" ||
          dataset.name.toLowerCase().includes(filter.search.toLowerCase()) ||
          dataset.originalFileName
            .toLowerCase()
            .includes(filter.search.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    },

    getSelectedDataset: () => {
      const { datasets, selectedDatasetId } = get();
      if (!selectedDatasetId) return null;
      return datasets.find((d) => d.id === selectedDatasetId) ?? null;
    },
  }))
);
