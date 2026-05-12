import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/ui/ProgressBar'

describe('ProgressBar', () => {
  test('should render with correct width percentage', () => {
    // Arrange & Act
    const { container } = render(<ProgressBar value={50} />)

    // Assert
    const progressFill = container.querySelector('.bg-primary')
    expect(progressFill).toHaveStyle({ width: '50%' })
  })

  test('should clamp value to 100 when exceeding', () => {
    // Arrange & Act
    const { container } = render(<ProgressBar value={150} />)

    // Assert
    const progressFill = container.querySelector('.bg-primary')
    expect(progressFill).toHaveStyle({ width: '100%' })
  })

  test('should clamp value to 0 when negative', () => {
    // Arrange & Act
    const { container } = render(<ProgressBar value={-10} />)

    // Assert
    const progressFill = container.querySelector('.bg-primary')
    expect(progressFill).toHaveStyle({ width: '0%' })
  })

  test('should show label when showLabel=true and size is not sm', () => {
    // Arrange & Act
    render(<ProgressBar value={75} showLabel size="md" />)

    // Assert
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  test('should not show label when size=sm even with showLabel=true', () => {
    // Arrange & Act
    render(<ProgressBar value={75} showLabel size="sm" />)

    // Assert
    expect(screen.queryByText('75%')).not.toBeInTheDocument()
  })
})
