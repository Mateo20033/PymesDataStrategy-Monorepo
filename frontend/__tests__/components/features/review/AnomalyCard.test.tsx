import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnomalyCard } from '@/components/features/review/AnomalyCard'
import { useReviewStore } from '@/store'
import { ANOMALY_TYPE, REVIEW_ACTION } from '@/types'
import type { Anomaly } from '@/types'
import type { PreviewResult, PreviewError } from '@/types/ir'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon">Check</span>,
  X: () => <span data-testid="x-icon">X</span>,
  PenTool: () => <span data-testid="pen-icon">PenTool</span>,
  CheckCircle2: () => <span data-testid="check-circle-icon">CheckCircle2</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="loader-icon" className={className}>Loader</span>
  ),
}))

// Mock next-auth session
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { accessToken: 'test-token' }, status: 'authenticated' }),
}))

const createMockAnomaly = (overrides?: Partial<Anomaly>): Anomaly => ({
  id: 'anomaly-1',
  datasetId: 'ds-1',
  type: ANOMALY_TYPE.FILL_NULLS,
  column: 'email',
  affectedRows: 150,
  sampleValues: ['', 'null', 'john@example.com'],
  suggestedFix: 'Rellenar con valor por defecto',
  confidence: 0.85,
  action: REVIEW_ACTION.PENDING,
  ...overrides,
})

const mockPreviewResult = (source: 'rule' | 'gemini', requiresConfirmation = false): PreviewResult => ({
  ir: { op: 'FILL_AGGREGATE', agg: 'median' },
  source,
  preview: {
    description: 'Rellenará las celdas afectadas con la mediana de la columna',
    affectedRows: 150,
    sampleResult: null,
    requiresConfirmation,
  },
})

const mockPreviewError = (error: 'gemini_unavailable' | 'invalid_instruction'): PreviewError => ({
  error,
  message:
    error === 'gemini_unavailable'
      ? 'No pudimos interpretar la instrucción en este momento.'
      : 'La columna "precio_lista" no existe en el dataset.',
  canRetry: error === 'gemini_unavailable',
})

describe('AnomalyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useReviewStore.setState({
      anomalies: [],
      currentAnomalyIndex: 0,
      isSubmitting: false,
    })
  })

  // ─── Existing regression tests ───────────────────────────────────────────────

  test('should render column badge', () => {
    const anomaly = createMockAnomaly({ column: 'phone_number' })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByText('Columna: phone_number')).toBeInTheDocument()
  })

  test('should render anomaly description based on type and affected rows', () => {
    const anomaly = createMockAnomaly({ type: ANOMALY_TYPE.FILL_NULLS, affectedRows: 150 })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByText('Se detectaron 150 valores nulos (celdas vacías).')).toBeInTheDocument()
  })

  test('should render AI suggestion', () => {
    const anomaly = createMockAnomaly({ suggestedFix: 'Normalizar formato de fecha' })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByText('Normalizar formato de fecha')).toBeInTheDocument()
    expect(screen.getByText('Sugerencia IA')).toBeInTheDocument()
  })

  test('should render action buttons when pending', () => {
    const anomaly = createMockAnomaly()
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByRole('button', { name: /aprobar regla/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  test('should call approveAnomaly when Aprobar Regla clicked', async () => {
    const user = userEvent.setup()
    const anomaly = createMockAnomaly()
    const approveAnomalySpy = vi.fn()
    useReviewStore.setState({ anomalies: [anomaly], approveAnomaly: approveAnomalySpy })
    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /aprobar regla/i }))
    expect(approveAnomalySpy).toHaveBeenCalledWith('anomaly-1')
  })

  test('should call discardAnomaly when Descartar clicked', async () => {
    const user = userEvent.setup()
    const anomaly = createMockAnomaly()
    const discardAnomalySpy = vi.fn()
    useReviewStore.setState({ anomalies: [anomaly], discardAnomaly: discardAnomalySpy })
    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /descartar/i }))
    expect(discardAnomalySpy).toHaveBeenCalledWith('anomaly-1')
  })

  test('should show undo button and status icon when approved', () => {
    const anomaly = createMockAnomaly({ action: REVIEW_ACTION.APPROVED })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByRole('button', { name: /deshacer acción/i })).toBeInTheDocument()
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aprobar regla/i })).not.toBeInTheDocument()
  })

  test('should show undo button and X icon when discarded', () => {
    const anomaly = createMockAnomaly({ action: REVIEW_ACTION.DISCARDED })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByRole('button', { name: /deshacer acción/i })).toBeInTheDocument()
    expect(screen.getByTestId('x-icon')).toBeInTheDocument()
  })

  test('should apply dimmed styles when not pending', () => {
    const anomaly = createMockAnomaly({ action: REVIEW_ACTION.APPROVED })
    const { container } = render(<AnomalyCard anomaly={anomaly} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('opacity-60')
  })

  test('should render description for REMOVE_DUPLICATES type', () => {
    const anomaly = createMockAnomaly({ type: ANOMALY_TYPE.REMOVE_DUPLICATES, affectedRows: 42 })
    render(<AnomalyCard anomaly={anomaly} />)
    expect(screen.getByText('42 registros duplicados encontrados.')).toBeInTheDocument()
  })

  // ─── Regression: isPlausibleAiValue guard ────────────────────────────────────

  test('isPlausibleAiValue guard: does not auto-apply narrative aiActionValue', async () => {
    const user = userEvent.setup()
    const correctAnomalySpy = vi.fn()
    const anomaly = createMockAnomaly({
      aiSuggestion: 'Rellenar con la mediana de la columna',
      aiActionType: 'FILL',
      aiActionValue: 'usa la mediana', // narrative — guard should block auto-apply
    })
    useReviewStore.setState({ anomalies: [anomaly], correctAnomaly: correctAnomalySpy })
    render(<AnomalyCard anomaly={anomaly} />)

    await user.click(screen.getByRole('button', { name: /aceptar ia/i }))

    // Should open the AI inline edit mode instead of calling correctAnomaly directly
    expect(correctAnomalySpy).not.toHaveBeenCalled()
    // The AI edit mode shows Aplicar + Cancelar buttons inside the purple panel
    expect(screen.getByRole('button', { name: /^aplicar$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toBeInTheDocument()
  })

  // ─── C4: Literal detection — no backend call ─────────────────────────────────

  test('literal "0": shows Aplicar button directly without Vista previa', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    await user.clear(screen.getByPlaceholderText(/escribe tu corrección o instrucción/i))
    await user.type(screen.getByPlaceholderText(/escribe tu corrección o instrucción/i), '0')

    // Vista previa button should NOT appear for a literal
    expect(screen.queryByRole('button', { name: /vista previa/i })).not.toBeInTheDocument()

    // Direct Aplicar button should appear
    expect(screen.getByRole('button', { name: /aplicar corrección/i })).toBeInTheDocument()
    expect(previewInstructionSpy).not.toHaveBeenCalled()
  })

  test('literal "0": clicking Aplicar corrección calls correctAnomaly with FILL_LITERAL IR', async () => {
    const user = userEvent.setup()
    const correctAnomalySpy = vi.fn()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], correctAnomaly: correctAnomalySpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: /aplicar corrección/i }))

    expect(correctAnomalySpy).toHaveBeenCalledWith('anomaly-1', {
      ir: { op: 'FILL_LITERAL', value: 0 },
      irSource: 'rule',
      irRawText: '0',
    })
  })

  test('literal "null" (case-insensitive): builds FILL_LITERAL(null) locally', async () => {
    const user = userEvent.setup()
    const correctAnomalySpy = vi.fn()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], correctAnomaly: correctAnomalySpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'null')
    await user.click(screen.getByRole('button', { name: /aplicar corrección/i }))

    expect(correctAnomalySpy).toHaveBeenCalledWith('anomaly-1', {
      ir: { op: 'FILL_LITERAL', value: null },
      irSource: 'rule',
      irRawText: 'null',
    })
  })

  test('quoted string literal: builds FILL_LITERAL with string value locally', async () => {
    const user = userEvent.setup()
    const correctAnomalySpy = vi.fn()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], correctAnomaly: correctAnomalySpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, '"sin dato"')
    await user.click(screen.getByRole('button', { name: /aplicar corrección/i }))

    expect(correctAnomalySpy).toHaveBeenCalledWith('anomaly-1', {
      ir: { op: 'FILL_LITERAL', value: 'sin dato' },
      irSource: 'rule',
      irRawText: '"sin dato"',
    })
  })

  // ─── C4: NL instruction — Vista previa button and backend call ───────────────

  test('NL instruction: Vista previa button appears', async () => {
    const user = userEvent.setup()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly] })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la mediana')

    expect(screen.getByRole('button', { name: /vista previa/i })).toBeInTheDocument()
  })

  test('NL instruction: clicking Vista previa calls previewInstruction and shows preview panel', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewResult('rule', false))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la mediana')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    expect(previewInstructionSpy).toHaveBeenCalledWith(
      'anomaly-1',
      'usa la mediana',
      'ds-1',
      'test-token'
    )

    await waitFor(() => {
      expect(screen.getByText('Rellenará las celdas afectadas con la mediana de la columna')).toBeInTheDocument()
    })
  })

  // ─── C4: Preview rule — badge verde ──────────────────────────────────────────

  test('preview rule: shows "Regla directa" badge and Aplicar button', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewResult('rule', false))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la mediana')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => {
      expect(screen.getByText(/regla directa/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^aplicar$/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument()
    })
  })

  // ─── C4: Preview Gemini — badge morado + Confirmar ───────────────────────────

  test('preview gemini: shows "Interpretado por IA" badge and Confirmar button', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewResult('gemini', true))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'si es mayor a 100 usa 100')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => {
      expect(screen.getByText(/interpretado por ia/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^aplicar$/i })).not.toBeInTheDocument()
    })
  })

  test('clicking Confirmar calls correctAnomaly with IRCorrection and closes edit mode', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewResult('gemini', true))
    const correctAnomalySpy = vi.fn()
    const anomaly = createMockAnomaly()
    useReviewStore.setState({
      anomalies: [anomaly],
      previewInstruction: previewInstructionSpy,
      correctAnomaly: correctAnomalySpy,
    })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'si es mayor a 100 usa 100')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => screen.getByRole('button', { name: /confirmar/i }))
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(correctAnomalySpy).toHaveBeenCalledWith('anomaly-1', {
      ir: { op: 'FILL_AGGREGATE', agg: 'median' },
      irSource: 'gemini',
      irRawText: 'si es mayor a 100 usa 100',
    })
    expect(screen.queryByPlaceholderText(/escribe tu corrección o instrucción/i)).not.toBeInTheDocument()
  })

  // ─── C4: Error gemini_unavailable — banner rojo + Reintentar ─────────────────

  test('error gemini_unavailable: shows red banner with Reintentar button', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewError('gemini_unavailable'))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la mediana')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => {
      expect(screen.getByText('No pudimos interpretar la instrucción en este momento.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
    })
  })

  test('error gemini_unavailable: Reintentar button re-calls previewInstruction', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi
      .fn()
      .mockResolvedValueOnce(mockPreviewError('gemini_unavailable'))
      .mockResolvedValueOnce(mockPreviewResult('rule', false))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la mediana')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => screen.getByRole('button', { name: /reintentar/i }))
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(previewInstructionSpy).toHaveBeenCalledTimes(2)
    await waitFor(() => {
      expect(screen.getByText(/regla directa/i)).toBeInTheDocument()
    })
  })

  // ─── C4: Error invalid_instruction — banner naranja sin Reintentar ───────────

  test('error invalid_instruction: shows orange banner without Reintentar button', async () => {
    const user = userEvent.setup()
    const previewInstructionSpy = vi.fn().mockResolvedValue(mockPreviewError('invalid_instruction'))
    const anomaly = createMockAnomaly()
    useReviewStore.setState({ anomalies: [anomaly], previewInstruction: previewInstructionSpy })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))
    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i)
    await user.clear(input)
    await user.type(input, 'usa la columna inexistente')
    await user.click(screen.getByRole('button', { name: /vista previa/i }))

    await waitFor(() => {
      expect(screen.getByText('La columna "precio_lista" no existe en el dataset.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument()
    })
  })

  // ─── C4: Re-edit seeding ──────────────────────────────────────────────────────

  test('re-edit: input is seeded with userCorrectionText when present', async () => {
    const user = userEvent.setup()
    const anomaly = createMockAnomaly({
      action: REVIEW_ACTION.PENDING,
      userCorrectionText: 'usa la mediana',
    })
    useReviewStore.setState({ anomalies: [anomaly] })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))

    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i) as HTMLInputElement
    expect(input.value).toBe('usa la mediana')
  })

  test('re-edit: input falls back to userCorrection when no userCorrectionText', async () => {
    const user = userEvent.setup()
    const anomaly = createMockAnomaly({
      action: REVIEW_ACTION.PENDING,
      userCorrection: '42',
      userCorrectionText: null,
    })
    useReviewStore.setState({ anomalies: [anomaly] })

    render(<AnomalyCard anomaly={anomaly} />)
    await user.click(screen.getByRole('button', { name: /editar/i }))

    const input = screen.getByPlaceholderText(/escribe tu corrección o instrucción/i) as HTMLInputElement
    expect(input.value).toBe('42')
  })
})

// ─── Store tests: correctAnomaly with string vs IRCorrection ─────────────────

describe('useReviewStore — correctAnomaly', () => {
  const baseAnomaly: Anomaly = {
    id: 'anomaly-store-1',
    datasetId: 'ds-1',
    type: ANOMALY_TYPE.FILL_NULLS,
    column: 'salario',
    affectedRows: 5,
    sampleValues: [],
    suggestedFix: 'Rellenar',
    confidence: 1,
    action: REVIEW_ACTION.PENDING,
  }

  // Capture real implementations at describe-collection time (before component
  // tests replace them with spies via setState).
  const realCorrectAnomaly = useReviewStore.getState().correctAnomaly
  const realSetAnomalies = useReviewStore.getState().setAnomalies

  beforeEach(() => {
    // Restore real actions (component tests may have replaced them with spies)
    useReviewStore.setState({ correctAnomaly: realCorrectAnomaly, setAnomalies: realSetAnomalies })
    useReviewStore.getState().setAnomalies([{ ...baseAnomaly }])
  })

  test('legacy string path: sets userCorrection and clears IR fields', () => {
    useReviewStore.getState().correctAnomaly('anomaly-store-1', '42.5')
    const anomaly = useReviewStore.getState().anomalies[0]
    expect(anomaly.action).toBe(REVIEW_ACTION.CORRECTED)
    expect(anomaly.userCorrection).toBe('42.5')
    expect(anomaly.userCorrectionIr).toBeNull()
    expect(anomaly.userCorrectionText).toBeNull()
    expect(anomaly.userCorrectionSource).toBeNull()
  })

  test('IRCorrection path: sets IR fields and clears userCorrection', () => {
    const irCorrection = {
      ir: { op: 'FILL_AGGREGATE' as const, agg: 'median' as const },
      irSource: 'rule' as const,
      irRawText: 'usa la mediana',
    }
    useReviewStore.getState().correctAnomaly('anomaly-store-1', irCorrection)
    const anomaly = useReviewStore.getState().anomalies[0]
    expect(anomaly.action).toBe(REVIEW_ACTION.CORRECTED)
    expect(anomaly.userCorrectionIr).toEqual({ op: 'FILL_AGGREGATE', agg: 'median' })
    expect(anomaly.userCorrectionText).toBe('usa la mediana')
    expect(anomaly.userCorrectionSource).toBe('rule')
    expect(anomaly.userCorrection).toBeUndefined()
  })

  test('IRCorrection path with gemini source', () => {
    const irCorrection = {
      ir: { op: 'DELETE_ROWS' as const },
      irSource: 'gemini' as const,
      irRawText: 'elimina las filas afectadas',
    }
    useReviewStore.getState().correctAnomaly('anomaly-store-1', irCorrection)
    const anomaly = useReviewStore.getState().anomalies[0]
    expect(anomaly.userCorrectionSource).toBe('gemini')
    expect(anomaly.userCorrectionIr).toEqual({ op: 'DELETE_ROWS' })
    expect(anomaly.userCorrectionText).toBe('elimina las filas afectadas')
  })

  test('does not affect other anomalies', () => {
    const second: Anomaly = { ...baseAnomaly, id: 'anomaly-store-2' }
    useReviewStore.setState({ anomalies: [{ ...baseAnomaly }, second] })
    useReviewStore.getState().correctAnomaly('anomaly-store-1', '0')
    const [first, sec] = useReviewStore.getState().anomalies
    expect(first.action).toBe(REVIEW_ACTION.CORRECTED)
    expect(sec.action).toBe(REVIEW_ACTION.PENDING)
  })
})
