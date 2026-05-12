import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { useAppStore } from '@/store'
import type { Dataset } from '@/types/dataset'
import type { ApiListResponse, TransformDatasetDto, UploadDatasetResponse } from '@/types/api'

const DATASETS_KEY = 'datasets'
const TERMINAL_STATUSES = ['READY', 'ERROR', 'ARCHIVED']

export function useDatasets() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  return useQuery<ApiListResponse<Dataset>>({
    queryKey: [DATASETS_KEY, token],
    queryFn: () => apiClient.get(API_ENDPOINTS.datasets.list(), token),
    enabled: !!token,
    refetchInterval: (query) => {
      const datasets = query.state.data?.data ?? []
      const hasProcessing = datasets.some((d) => !TERMINAL_STATUSES.includes(d.status))
      return hasProcessing ? 3000 : 30000 // Slow poll — never fully off
    },
  })
}

export function useDataset(id: string) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  return useQuery<{ success: boolean; data: Dataset }>({
    queryKey: [DATASETS_KEY, id, token],
    queryFn: () => apiClient.get(API_ENDPOINTS.datasets.get(id), token),
    enabled: !!id && !!token,
  })
}

export function useUploadDataset() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      return apiClient.postForm<{ success: boolean; data: UploadDatasetResponse }>(
        API_ENDPOINTS.datasets.create(),
        formData,
        token
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] })
    },
  })
}

export function useDeleteDataset() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  const queryClient = useQueryClient()
  const setDatasets = useAppStore((s) => s.setDatasets)
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(API_ENDPOINTS.datasets.delete(id), token),
    onMutate: (id: string) => {
      // Optimistically remove from store so the table updates immediately
      const current = useAppStore.getState().datasets
      setDatasets(current.filter((d) => d.id !== id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: () => {
      // On error, refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] })
    },
  })
}

export function useTransformDataset(datasetId: string) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: TransformDatasetDto) =>
      apiClient.post(API_ENDPOINTS.datasets.transform(datasetId), dto, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DATASETS_KEY] })
    },
  })
}
