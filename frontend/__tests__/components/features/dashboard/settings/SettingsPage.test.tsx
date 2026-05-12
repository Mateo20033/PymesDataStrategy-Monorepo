import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock useAuth
const mockUser = { id: 'user-1', name: 'Juan García', email: 'juan@example.com' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    accessToken: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}))

// Mock apiClient
const mockPatch = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
}))

import SettingsPage from '@/app/dashboard/settings/page'

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el formulario de perfil con los campos correctos', () => {
    render(<SettingsPage />)

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })

  it('pre-rellena el campo nombre con el usuario actual', () => {
    render(<SettingsPage />)

    const nameInput = screen.getByLabelText(/nombre/i)
    expect(nameInput).toHaveValue('Juan García')
  })

  it('el campo email es read-only y muestra el email del usuario', () => {
    render(<SettingsPage />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    expect(emailInput).toHaveValue('juan@example.com')
    expect(emailInput).toBeDisabled()
  })

  it('muestra error de validación cuando el nombre es muy corto', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const nameInput = screen.getByLabelText(/nombre/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'A')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument()
    })
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('llama a apiClient.patch con los datos correctos al guardar', async () => {
    mockPatch.mockResolvedValue({ success: true })
    const user = userEvent.setup()
    render(<SettingsPage />)

    const nameInput = screen.getByLabelText(/nombre/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'María López')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        { name: 'María López' },
        'mock-token'
      )
    })
  })

  it('muestra toast de éxito tras guardar correctamente', async () => {
    mockPatch.mockResolvedValue({ success: true })
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Perfil actualizado correctamente.')
    })
  })

  it('muestra toast de error si la petición falla', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'))
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Error al guardar los cambios. Intenta de nuevo.'
      )
    })
  })
})
