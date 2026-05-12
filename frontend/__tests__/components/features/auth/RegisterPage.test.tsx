import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock api-endpoints
vi.mock('@/lib/api-endpoints', () => ({
  API_ENDPOINTS: {
    auth: {
      register: () => 'http://localhost:3000/api/v1/auth/register',
    },
  },
}))

import RegisterPage from '@/app/(auth)/register/page'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, and password fields', () => {
    render(<RegisterPage />)

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByRole('link', { name: /iniciar sesión/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('shows validation error for short name', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'J')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'j@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'not-valid')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText(/correo electrónico no válido/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), '1234567')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls fetch with correct data on valid form submit', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'user-1', email: 'juan@example.com', name: 'Juan' }),
    })
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'securepass123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            name: 'Juan Pérez',
            email: 'juan@example.com',
            password: 'securepass123',
          }),
        })
      )
    })
  })

  it('redirects to /login after successful registration', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'user-1', email: 'juan@example.com', name: 'Juan' }),
    })
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login?registered=true')
    })
  })

  it('shows error when email already exists (409)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Email already in use' }),
    })
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/ya existe una cuenta/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while submitting', async () => {
    let resolveFetch!: (val: unknown) => void
    mockFetch.mockReturnValue(new Promise((res) => { resolveFetch = res }))

    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'juan@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeInTheDocument()
    })

    // Cleanup
    resolveFetch({ ok: true, json: async () => ({}) })
  })
})
