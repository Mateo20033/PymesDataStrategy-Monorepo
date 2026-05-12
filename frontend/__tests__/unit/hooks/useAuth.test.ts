import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock next-auth/react
const mockUseSession = vi.fn()
const mockSignOut = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next/navigation
const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
  }),
}))

import { useAuth } from '@/hooks/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user and accessToken when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-jwt-token.payload.signature',
      },
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user?.email).toBe('test@example.com')
    expect(result.current.accessToken).toBe('mock-jwt-token.payload.signature')
  })

  it('returns isLoading true when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeUndefined()
    expect(result.current.accessToken).toBeUndefined()
  })

  it('returns isAuthenticated false when unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeUndefined()
  })

  it('calls signOut and redirects to /login on logout', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        accessToken: 'token',
      },
      status: 'authenticated',
    })
    mockSignOut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })
})
