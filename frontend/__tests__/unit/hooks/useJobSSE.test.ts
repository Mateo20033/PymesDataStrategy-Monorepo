import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ─── Mock next-auth (useJobSSE uses useSession for the auth token) ───────────
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { accessToken: 'test-token' }, status: 'authenticated' }),
}))

// ─── Mock EventSource ────────────────────────────────────────────────────────
type EventSourceHandler = (e: MessageEvent) => void
type EventMap = Record<string, EventSourceHandler[]>

class MockEventSource {
  static instances: MockEventSource[] = []
  url: string
  closed = false
  private listeners: EventMap = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(event: string, handler: EventSourceHandler) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(handler)
  }

  removeEventListener(event: string, handler: EventSourceHandler) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((h) => h !== handler)
  }

  close() {
    this.closed = true
  }

  /** Test helper — emit a named SSE event with JSON data */
  emit(event: string, data: Record<string, unknown>) {
    const msg = { data: JSON.stringify(data) } as MessageEvent
    for (const h of this.listeners[event] ?? []) h(msg)
  }
}

vi.stubGlobal('EventSource', MockEventSource)

// ─── Mock React Query invalidateQueries ─────────────────────────────────────
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  }
})

import { useJobSSE } from '@/hooks/useJobSSE'

// ─── Wrapper ─────────────────────────────────────────────────────────────────
function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function W({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
}

describe('useJobSSE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockEventSource.instances.length = 0
  })

  afterEach(() => {
    // Close any open EventSource instances
    MockEventSource.instances.forEach((es) => es.close())
  })

  it('no crea EventSource cuando jobId es null', () => {
    renderHook(() => useJobSSE(null), { wrapper: createWrapper() })
    expect(MockEventSource.instances).toHaveLength(0)
  })

  it('crea EventSource con la URL correcta cuando se proporciona jobId', () => {
    renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    // React Strict Mode monta 2 veces en desarrollo — al menos 1 instancia debe crearse
    expect(MockEventSource.instances.length).toBeGreaterThanOrEqual(1)
    expect(MockEventSource.instances.some((es) => es.url.includes('/api/v1/jobs/job-123/events'))).toBe(true)
  })

  it('devuelve status undefined inicialmente', () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    expect(result.current.status).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('actualiza status cuando recibe evento SSE de tipo status', () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    // En Strict Mode puede haber 2 instancias — usar la última activa
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'processing' })
    })

    expect(result.current.status).toBe('PROCESSING')
  })

  it('normaliza el status a mayúsculas (queued → QUEUED)', () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'queued' })
    })

    expect(result.current.status).toBe('QUEUED')
  })

  it('cierra la conexión al recibir status completed', async () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'completed' })
    })

    expect(result.current.status).toBe('COMPLETED')
    expect(es.closed).toBe(true)
  })

  it('cierra la conexión al recibir status failed', async () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'failed', error: 'Python crashed' })
    })

    expect(result.current.status).toBe('FAILED')
    expect(result.current.error).toBe('Python crashed')
    expect(es.closed).toBe(true)
  })

  it('invalida datasets y stats cuando el job completa', () => {
    renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'completed' })
    })

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['datasets'] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['stats'] })
  })

  it('NO invalida queries cuando el job falla', () => {
    renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    act(() => {
      es.emit('status', { jobId: 'job-123', status: 'failed' })
    })

    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })

  it('cierra EventSource al desmontar el hook', () => {
    const { unmount } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    const es = MockEventSource.instances.filter((e) => !e.closed).at(-1)!

    unmount()

    expect(es.closed).toBe(true)
  })

  it('isConnected es true mientras la conexión está abierta', () => {
    const { result } = renderHook(() => useJobSSE('job-123'), { wrapper: createWrapper() })
    expect(result.current.isConnected).toBe(true)
  })
})
