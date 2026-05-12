import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock recharts para evitar problemas de SVG en jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
}))

// Mock useStats
const mockUseStats = vi.fn()
vi.mock('@/hooks/useStats', () => ({
  useStats: () => mockUseStats(),
}))

import { MetricsBand } from '@/components/features/dashboard/MetricsBand'
import React from 'react'

const mockStats = {
  totalDatasets: 12,
  datasetsThisMonth: 4,
  totalJobs: 10,
  jobsCompleted: 9,
  jobsFailed: 1,
  avgProcessingTimeMs: 2300,
  pendingReviews: 2,
}

describe('MetricsBand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra skeleton mientras carga', () => {
    mockUseStats.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<MetricsBand />)
    // En estado loading no se muestran métricas
    expect(screen.queryByText('Métricas del Sistema')).not.toBeInTheDocument()
  })

  it('muestra error si falla la carga', () => {
    mockUseStats.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<MetricsBand />)
    expect(screen.getByText(/no se pudieron cargar las métricas/i)).toBeInTheDocument()
  })

  it('muestra las métricas cuando los datos están disponibles', () => {
    mockUseStats.mockReturnValue({ data: mockStats, isLoading: false, isError: false })
    render(<MetricsBand />)

    expect(screen.getByText('Métricas del Sistema')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument() // totalDatasets
    expect(screen.getByText('10')).toBeInTheDocument() // totalJobs
    expect(screen.getByText('9')).toBeInTheDocument()  // jobsCompleted
    expect(screen.getByText('1')).toBeInTheDocument()  // jobsFailed
    expect(screen.getByText('2')).toBeInTheDocument()  // pendingReviews
  })

  it('formatea el tiempo promedio correctamente en segundos', () => {
    mockUseStats.mockReturnValue({ data: mockStats, isLoading: false, isError: false })
    render(<MetricsBand />)
    expect(screen.getByText('2.3s')).toBeInTheDocument()
  })

  it('muestra "—" cuando avgProcessingTimeMs es 0', () => {
    mockUseStats.mockReturnValue({
      data: { ...mockStats, avgProcessingTimeMs: 0 },
      isLoading: false,
      isError: false,
    })
    render(<MetricsBand />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renderiza el chart de jobs', () => {
    mockUseStats.mockReturnValue({ data: mockStats, isLoading: false, isError: false })
    render(<MetricsBand />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
