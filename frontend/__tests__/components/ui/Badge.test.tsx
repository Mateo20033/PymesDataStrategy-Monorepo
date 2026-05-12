import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  test('should render children correctly', () => {
    // Arrange & Act
    render(<Badge>Status</Badge>)

    // Assert
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  test('should apply default variant styles', () => {
    // Arrange & Act
    render(<Badge>Default</Badge>)

    // Assert
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-surface')
    expect(badge).toHaveClass('text-text')
  })

  test('should apply success variant styles', () => {
    // Arrange & Act
    render(<Badge variant="success">Success</Badge>)

    // Assert
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-success')
    expect(badge).toHaveClass('text-text-inverted')
  })

  test('should apply error variant styles', () => {
    // Arrange & Act
    render(<Badge variant="error">Error</Badge>)

    // Assert
    const badge = screen.getByText('Error')
    expect(badge).toHaveClass('bg-error')
    expect(badge).toHaveClass('text-text-inverted')
  })
})
