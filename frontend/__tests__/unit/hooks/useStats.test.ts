import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ accessToken: 'mock-token.payload.sig', user: null, isAuthenticated: false, logout: vi.fn() }),
}))

// Mock apiClient
const mockGet = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
}))

import { useStats } from '@/hooks/useStats'

const mockStatsData = {
  totalDatasets: 10,
  datasetsThisMonth: 3,
  totalJobs: 9,
  jobsCompleted: 7,
  jobsFailed: 2,
  avgProcessingTimeMs: 1500,
  pendingReviews: 1,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna datos de stats correctamente', async () => {
    mockGet.mockResolvedValue({ success: true, data: mockStatsData })

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() })

    // Esperar a que la query se resuelva
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockStatsData)
    expect(result.current.isError).toBe(false)
  })

  it('maneja errores correctamente', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() })

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('llama al endpoint correcto', async () => {
    mockGet.mockResolvedValue({ success: true, data: mockStatsData })

    renderHook(() => useStats(), { wrapper: createWrapper() })

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stats'),
        expect.any(String)
      )
    })
  })
})
