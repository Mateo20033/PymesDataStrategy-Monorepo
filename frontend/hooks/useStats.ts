import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { useAuth } from '@/hooks/useAuth'

export interface StatsResponse {
  totalDatasets: number
  datasetsThisMonth: number
  totalJobs: number
  jobsCompleted: number
  jobsFailed: number
  avgProcessingTimeMs: number
  pendingReviews: number
}

export function useStats() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: StatsResponse }>(
        API_ENDPOINTS.stats.list(),
        accessToken ?? undefined
      )
      return response.data
    },
    staleTime: 0,
    enabled: !!accessToken,
  })
}
