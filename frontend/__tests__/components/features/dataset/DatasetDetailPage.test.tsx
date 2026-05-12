import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DatasetDetailPage from '@/app/dashboard/datasets/[id]/page'

// ─── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'dataset-123' }),
  useRouter: () => ({ push: mockPush }),
}))

// ─── Mock @tanstack/react-query (useQueryClient) ─────────────────────────────
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

// ─── Mock useDataset ──────────────────────────────────────────────────────────
const mockUseDataset = vi.fn()
vi.mock('@/hooks/api', () => ({
  useDataset: (...args: unknown[]) => mockUseDataset(...args),
  useTransformDataset: (...args: unknown[]) => mockUseTransformDataset(...args),
}))

// ─── Mock useTransformDataset ─────────────────────────────────────────────────
const mockMutate = vi.fn()
const mockUseTransformDataset = vi.fn()

// ─── Mock useJobPoller ────────────────────────────────────────────────────────
const mockUseJobPoller = vi.fn()
vi.mock('@/hooks/useJobPoller', () => ({
  useJobPoller: (...args: unknown[]) => mockUseJobPoller(...args),
}))

// ─── Mock lucide-react ────────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">←</span>,
}))

// ─── Base fixtures ────────────────────────────────────────────────────────────
const idlePoller = {
  jobStatus: undefined,
  isPolling: false,
  isCompleted: false,
  isFailed: false,
  error: undefined,
}

const mockDataset = {
  id: 'dataset-123',
  name: 'Ventas Q1 2024',
  originalFileName: 'ventas_q1.xlsx',
  status: 'READY' as const,
  description: 'Dataset de ventas del primer trimestre',
  storageKey: 'files/ventas_q1.xlsx',
  fileSizeBytes: 204800,
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  userId: 'user-001',
  schema: null,
  statistics: null,
  metadata: {},
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:35:00Z',
}

describe('DatasetDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default poller: idle
    mockUseJobPoller.mockReturnValue(idlePoller)

    // Default transform mutation: idle
    mockUseTransformDataset.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
  })

  // ── Test 3.5.1: Loading state ─────────────────────────────────────────────
  test('renderiza estado de carga', () => {
    mockUseDataset.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<DatasetDetailPage />)

    expect(screen.getByText('Cargando dataset...')).toBeInTheDocument()
  })

  // ── Test 3.5.2: Error state ───────────────────────────────────────────────
  test('renderiza estado de error', () => {
    mockUseDataset.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<DatasetDetailPage />)

    expect(
      screen.getByText('Error al cargar el dataset. Por favor, inténtalo de nuevo.')
    ).toBeInTheDocument()
    expect(screen.getByText('← Volver al Dashboard')).toBeInTheDocument()
  })

  // ── Test 3.5.3: Renders dataset data ─────────────────────────────────────
  test('renderiza datos del dataset (nombre, estado, tamaño)', () => {
    mockUseDataset.mockReturnValue({
      data: { success: true, data: mockDataset },
      isLoading: false,
      isError: false,
    })

    render(<DatasetDetailPage />)

    // Name
    expect(screen.getByText('Ventas Q1 2024')).toBeInTheDocument()
    // Status badge
    expect(screen.getByText('LISTO')).toBeInTheDocument()
    // File size (200 KB)
    expect(screen.getByText('200.0 KB')).toBeInTheDocument()
    // Original file name
    expect(screen.getByText('ventas_q1.xlsx')).toBeInTheDocument()
    // User
    expect(screen.getByText(/user-001/)).toBeInTheDocument()
  })

  // ── Test 3.5.4: Transform form has all 6 options ──────────────────────────
  test('formulario de transformaciones renderiza las 6 opciones', () => {
    mockUseDataset.mockReturnValue({
      data: { success: true, data: mockDataset },
      isLoading: false,
      isError: false,
    })

    render(<DatasetDetailPage />)

    expect(screen.getByText('Limpiar valores nulos')).toBeInTheDocument()
    expect(screen.getByText('Normalizar datos')).toBeInTheDocument()
    expect(screen.getByText('Agregar/Agrupar')).toBeInTheDocument()
    expect(screen.getByText('Filtrar registros')).toBeInTheDocument()
    expect(screen.getByText('Combinar columnas')).toBeInTheDocument()
    expect(screen.getByText('Transformación personalizada')).toBeInTheDocument()
  })

  // ── Test 3.5.5: Execute button calls mutation ─────────────────────────────
  test('botón ejecutar llama a la mutación con el tipo seleccionado', async () => {
    mockUseDataset.mockReturnValue({
      data: { success: true, data: mockDataset },
      isLoading: false,
      isError: false,
    })

    render(<DatasetDetailPage />)

    const button = screen.getByText('Ejecutar Transformación')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { transformationType: 'CLEAN_NULLS' },
        expect.any(Object)
      )
    })
  })

  // ── Extra: Button disabled while pending ──────────────────────────────────
  test('botón ejecutar está deshabilitado mientras hay mutación en progreso', () => {
    mockUseDataset.mockReturnValue({
      data: { success: true, data: mockDataset },
      isLoading: false,
      isError: false,
    })
    mockUseTransformDataset.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<DatasetDetailPage />)

    const button = screen.getByText('Ejecutando...')
    expect(button.closest('button')).toBeDisabled()
  })

  // ── Extra: Error back button navigates to dashboard ───────────────────────
  test('botón volver en estado de error navega al dashboard', () => {
    mockUseDataset.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<DatasetDetailPage />)

    fireEvent.click(screen.getByText('← Volver al Dashboard'))
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
