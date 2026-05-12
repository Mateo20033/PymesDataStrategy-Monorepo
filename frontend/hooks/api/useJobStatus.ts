import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import type { ApiJob } from '@/types/api'

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED']

export function useJobStatus(jobId: string | null) {
  const { data: session } = useSession()
  const token = session?.accessToken ?? undefined
  return useQuery<ApiJob>({
    queryKey: ['jobs', jobId, token],
    queryFn: () => apiClient.get(API_ENDPOINTS.jobs.get(jobId!), token),
    enabled: !!jobId && !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || TERMINAL_STATUSES.includes(status)) return false
      return 2000 // poll each 2s while QUEUED or PROCESSING
    },
  })
}
