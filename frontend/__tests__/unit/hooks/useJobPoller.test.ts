import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useJobPoller } from '@/hooks/useJobPoller'
import type { JobStatus } from '@/types/api'

// Mock useJobSSE (nueva implementación SSE)
const mockUseJobSSE = vi.fn()
vi.mock('@/hooks/useJobSSE', () => ({
  useJobSSE: (...args: unknown[]) => mockUseJobSSE(...args),
}))

const makeSSEResult = (
  status: JobStatus | undefined,
  error?: string,
  isConnected = false
) => ({ status, error, isConnected })

describe('useJobPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseJobSSE.mockReturnValue(makeSSEResult(undefined, undefined, false))
  })

  test('devuelve valores iniciales cuando jobId es null', () => {
    const { result } = renderHook(() => useJobPoller(null))

    expect(result.current.jobStatus).toBeUndefined()
    expect(result.current.isPolling).toBe(false)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.isFailed).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  test('llama a useJobSSE con el jobId recibido', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult(undefined, undefined, true))

    renderHook(() => useJobPoller('job-001'))

    expect(mockUseJobSSE).toHaveBeenCalledWith('job-001')
  })

  test('isPolling es true cuando isConnected es true y no es terminal', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('QUEUED', undefined, true))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.isPolling).toBe(true)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.isFailed).toBe(false)
  })

  test('isPolling es true cuando status es PROCESSING y conexión abierta', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('PROCESSING', undefined, true))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.isPolling).toBe(true)
    expect(result.current.jobStatus).toBe('PROCESSING')
  })

  test('isCompleted es true y isPolling es false cuando status es COMPLETED', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('COMPLETED', undefined, false))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.isCompleted).toBe(true)
    expect(result.current.isPolling).toBe(false)
    expect(result.current.isFailed).toBe(false)
  })

  test('isFailed es true y isPolling es false cuando status es FAILED', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('FAILED', 'Error de procesamiento', false))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.isFailed).toBe(true)
    expect(result.current.isPolling).toBe(false)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.error).toBe('Error de procesamiento')
  })

  test('isPolling es false cuando status es CANCELLED', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('CANCELLED', undefined, false))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.isPolling).toBe(false)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.isFailed).toBe(false)
  })

  test('error es undefined cuando no hay error', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('COMPLETED', undefined, false))

    const { result } = renderHook(() => useJobPoller('job-001'))

    expect(result.current.error).toBeUndefined()
  })

  test('isPolling es false cuando jobId es null', () => {
    mockUseJobSSE.mockReturnValue(makeSSEResult('QUEUED', undefined, false))

    const { result } = renderHook(() => useJobPoller(null))

    expect(result.current.isPolling).toBe(false)
  })
})
