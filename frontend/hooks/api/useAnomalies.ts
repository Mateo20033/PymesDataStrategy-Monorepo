import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import type {
  ApiAnomaly,
  SubmitDecisionsDto,
  SubmitDecisionsResponse,
} from '@/types/api'

const ANOMALIES_KEY = 'anomalies'

/**
 * Fetch all anomalies for a given dataset.
 * GET /api/v1/datasets/:datasetId/anomalies
 *
 * @param pollForSuggestions - when true, polls every 4 s until all anomalies
 *   have an aiSuggestion. Useful on the review page while waiting for Gemini.
 */
export function useAnomalies(datasetId: string, pollForSuggestions = false) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  return useQuery<{ success: boolean; data: ApiAnomaly[] }>({
    queryKey: [ANOMALIES_KEY, datasetId, token],
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.anomalies.list(datasetId), token),
    enabled: !!datasetId && !!token,
    refetchInterval: pollForSuggestions
      ? (query) => {
          const data = query.state.data?.data ?? []
          // Stop polling once every anomaly has an aiSuggestion
          const allHaveSuggestion = data.length > 0 && data.every((a) => a.aiSuggestion)
          return allHaveSuggestion ? false : 4000
        }
      : false,
  })
}

/**
 * Submit human decisions for anomalies in a dataset (HITL flow).
 * POST /api/v1/datasets/:datasetId/decisions
 */
export function useSubmitDecisions(datasetId: string) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  const queryClient = useQueryClient()
  return useMutation<
    { success: boolean; data: SubmitDecisionsResponse },
    Error,
    SubmitDecisionsDto
  >({
    mutationFn: (dto: SubmitDecisionsDto) =>
      apiClient.post(
        API_ENDPOINTS.anomalies.submitDecisions(datasetId),
        dto,
        token
      ),
    onSuccess: () => {
      // Invalidate anomalies cache so the list refreshes
      queryClient.invalidateQueries({ queryKey: [ANOMALIES_KEY, datasetId] })
      // Invalidate datasets and stats so the dashboard reflects the new ETL job
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
