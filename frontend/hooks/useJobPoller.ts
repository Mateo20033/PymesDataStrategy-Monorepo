import { useJobSSE } from '@/hooks/useJobSSE'
import type { JobStatus } from '@/types/api'

const TERMINAL_STATUSES: JobStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED']

export interface UseJobPollerResult {
  jobStatus: JobStatus | undefined
  isPolling: boolean
  isCompleted: boolean
  isFailed: boolean
  error: string | undefined
}

/**
 * Tracks a job's status via Server-Sent Events (SSE).
 * Maintains the same public interface as the previous polling-based version
 * so consumers (FileDropzone, DatasetDetailPage) require no changes.
 */
export function useJobPoller(jobId: string | null): UseJobPollerResult {
  const { status, error, isConnected } = useJobSSE(jobId)

  const isTerminal = status !== undefined && TERMINAL_STATUSES.includes(status)

  return {
    jobStatus: status,
    // isPolling === true while we have a jobId and the SSE connection is open
    isPolling: !!jobId && (isConnected || (!isTerminal && status === undefined)),
    isCompleted: status === 'COMPLETED',
    isFailed: status === 'FAILED',
    error,
  }
}
