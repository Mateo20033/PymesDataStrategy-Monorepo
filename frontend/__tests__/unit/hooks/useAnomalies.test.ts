import { describe, test, expect, vi, beforeEach } from 'vitest'
/* eslint-disable react/display-name */
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// Mock next-auth/react — hooks internamente usan useSession
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { accessToken: 'mock-token.payload.sig', user: { id: 'user-1' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock api-client
const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}))

// Mock api-endpoints
vi.mock('@/lib/api-endpoints', () => ({
  API_ENDPOINTS: {
    anomalies: {
      list: (datasetId: string) => `/api/v1/datasets/${datasetId}/anomalies`,
      submitDecisions: (datasetId: string) => `/api/v1/datasets/${datasetId}/decisions`,
    },
  },
}))

import { useAnomalies, useSubmitDecisions } from '@/hooks/api/useAnomalies'
import type { ApiAnomaly } from '@/types/api'

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const makeApiAnomaly = (overrides?: Partial<ApiAnomaly>): ApiAnomaly => ({
  id: 'anomaly-1',
  datasetId: 'dataset-abc',
  column: 'email',
  type: 'MISSING_VALUE',
  description: '5 missing values',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('useAnomalies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('fetches anomalies for a dataset', async () => {
    const anomaly = makeApiAnomaly()
    mockGet.mockResolvedValue({ success: true, data: [anomaly] })

    const { result } = renderHook(() => useAnomalies('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/datasets/dataset-abc/anomalies',
      'mock-token.payload.sig'
    )
    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0]?.id).toBe('anomaly-1')
  })

  test('returns empty data array when no anomalies exist', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] })

    const { result } = renderHook(() => useAnomalies('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(0)
  })

  test('is disabled when datasetId is empty string', () => {
    const { result } = renderHook(() => useAnomalies(''), {
      wrapper: makeWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGet).not.toHaveBeenCalled()
  })

  test('handles fetch error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAnomalies('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
  })
})

describe('useSubmitDecisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('posts decisions to the correct endpoint', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { resolved: 1, results: [{ anomalyId: 'anomaly-1', action: 'APPROVED', decisionId: 'dec-1' }] },
    })

    const { result } = renderHook(() => useSubmitDecisions('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    result.current.mutate({
      decisions: [{ anomalyId: 'anomaly-1', action: 'APPROVED' }],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/datasets/dataset-abc/decisions',
      { decisions: [{ anomalyId: 'anomaly-1', action: 'APPROVED' }] },
      'mock-token.payload.sig'
    )
    expect(result.current.data?.data.resolved).toBe(1)
  })

  test('handles submit error', async () => {
    mockPost.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useSubmitDecisions('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    result.current.mutate({ decisions: [{ anomalyId: 'anomaly-1', action: 'APPROVED' }] })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Server error')
  })

  test('supports CORRECTED action with correction text', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { resolved: 1, results: [{ anomalyId: 'anomaly-2', action: 'CORRECTED', decisionId: 'dec-2' }] },
    })

    const { result } = renderHook(() => useSubmitDecisions('dataset-abc'), {
      wrapper: makeWrapper(),
    })

    result.current.mutate({
      decisions: [{ anomalyId: 'anomaly-2', action: 'CORRECTED', correction: 'valor correcto' }],
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/datasets/dataset-abc/decisions',
      expect.objectContaining({
        decisions: [{ anomalyId: 'anomaly-2', action: 'CORRECTED', correction: 'valor correcto' }],
      }),
      'mock-token.payload.sig'
    )
  })
})
